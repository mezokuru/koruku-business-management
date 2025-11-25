import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import type { Project, ProjectInput } from '../../types/database';
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects';
import { useClients } from '../../hooks/useClients';
import { calculateSupportEndDate, validateURL } from '../../lib/utils';
import { X } from 'lucide-react';

interface ProjectFormProps {
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectForm({ project, isOpen, onClose }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectInput>({
    name: '',
    client_id: '',
    status: 'planning',
    project_type: 'website',
    start_date: '',
    support_months: 6,
    support_end_date: '',
    description: '',
    tech_stack: [],
    live_url: '',
    github_url: '',
    repo_url: '',
    staging_url: '',
    production_url: '',
    labour_percentage: 30,
    labour_amount: undefined,
    infrastructure_amount: undefined,
  });

  const [techStackInput, setTechStackInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: clients = [] } = useClients(true); // Only active clients

  useEffect(() => {
    // Use queueMicrotask to avoid setState during render
    queueMicrotask(() => {
      if (project) {
        setFormData({
          name: project.name,
          client_id: project.client_id,
          status: project.status,
          project_type: project.project_type || 'website',
          start_date: project.start_date,
          support_months: project.support_months,
          support_end_date: project.support_end_date,
          description: project.description || '',
          tech_stack: project.tech_stack || [],
          live_url: project.live_url || '',
          github_url: project.github_url || '',
          repo_url: project.repo_url || '',
          staging_url: project.staging_url || '',
          production_url: project.production_url || '',
          labour_percentage: project.labour_percentage ?? 30,
          labour_amount: project.labour_amount,
          infrastructure_amount: project.infrastructure_amount,
        });
      } else {
        setFormData({
          name: '',
          client_id: '',
          status: 'planning',
          project_type: 'website',
          start_date: '',
          support_months: 6,
          support_end_date: '',
          description: '',
          tech_stack: [],
          live_url: '',
          github_url: '',
          repo_url: '',
          staging_url: '',
          production_url: '',
          labour_percentage: 30,
          labour_amount: undefined,
          infrastructure_amount: undefined,
        });
      }
      setTechStackInput('');
      setErrors({});
    });
  }, [project, isOpen]);

  // Auto-calculate support_end_date when start_date or support_months change
  useEffect(() => {
    if (formData.start_date && formData.support_months >= 0) {
      const endDate = calculateSupportEndDate(formData.start_date, formData.support_months);
      // Use queueMicrotask to avoid setState during render
      queueMicrotask(() => {
        setFormData((prev) => ({ ...prev, support_end_date: endDate }));
      });
    }
  }, [formData.start_date, formData.support_months]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation (required, 3-200 characters)
    if (!formData.name.trim()) {
      newErrors.name = 'This field is required';
    } else if (formData.name.length < 3 || formData.name.length > 200) {
      newErrors.name = 'Project name must be between 3 and 200 characters';
    }

    // Client validation (required)
    if (!formData.client_id) {
      newErrors.client_id = 'This field is required';
    }

    // Status validation (required)
    if (!formData.status) {
      newErrors.status = 'This field is required';
    }

    // Start date validation (required, can be any date - backdating allowed)
    if (!formData.start_date) {
      newErrors.start_date = 'This field is required';
    }

    // Support months validation (required, 0-60)
    if (formData.support_months === null || formData.support_months === undefined) {
      newErrors.support_months = 'This field is required';
    } else if (formData.support_months < 0 || formData.support_months > 60) {
      newErrors.support_months = 'Support months must be between 0 and 60';
    }

    // Description validation (optional, max 2000 characters)
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must not exceed 2000 characters';
    }

    // Live URL validation (optional, valid URL format)
    if (formData.live_url && !validateURL(formData.live_url)) {
      newErrors.live_url = 'Please enter a valid URL (e.g., https://example.com)';
    }

    // GitHub URL validation (optional, valid URL format)
    if (formData.github_url && !validateURL(formData.github_url)) {
      newErrors.github_url = 'Please enter a valid URL (e.g., https://github.com/user/repo)';
    }

    // Repo URL validation (optional, valid URL format)
    if (formData.repo_url && !validateURL(formData.repo_url)) {
      newErrors.repo_url = 'Please enter a valid URL';
    }

    // Staging URL validation (optional, valid URL format)
    if (formData.staging_url && !validateURL(formData.staging_url)) {
      newErrors.staging_url = 'Please enter a valid URL';
    }

    // Production URL validation (optional, valid URL format)
    if (formData.production_url && !validateURL(formData.production_url)) {
      newErrors.production_url = 'Please enter a valid URL';
    }

    // Labour percentage validation (optional, 0-100)
    if (formData.labour_percentage !== undefined && formData.labour_percentage !== null) {
      if (formData.labour_percentage < 0 || formData.labour_percentage > 100) {
        newErrors.labour_percentage = 'Labour percentage must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (project) {
        await updateProject.mutateAsync({ id: project.id, ...formData });
      } else {
        await createProject.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      // Error handling is done in the hooks
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field: keyof ProjectInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddTechStack = () => {
    if (techStackInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tech_stack: [...(prev.tech_stack || []), techStackInput.trim()],
      }));
      setTechStackInput('');
    }
  };

  const handleRemoveTechStack = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tech_stack: prev.tech_stack?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleTechStackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTechStack();
    }
  };

  const isSubmitting = createProject.isPending || updateProject.isPending;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Edit Project' : 'New Project'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          required
          disabled={isSubmitting}
          placeholder="Enter project name"
        />

        <div className="w-full">
          <label
            htmlFor="client_id"
            className="block text-sm font-medium text-[#2c3e50] mb-1"
          >
            Client <span className="text-[#e74c3c]">*</span>
          </label>
          <select
            id="client_id"
            value={formData.client_id}
            onChange={(e) => handleChange('client_id', e.target.value)}
            disabled={isSubmitting}
            className={`
              w-full px-3 py-2 border rounded min-h-[44px]
              ${errors.client_id ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
            aria-required="true"
            aria-invalid={!!errors.client_id}
            aria-describedby={errors.client_id ? 'client_id-error' : undefined}
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.business}
              </option>
            ))}
          </select>
          {errors.client_id && (
            <p id="client_id-error" className="mt-1 text-sm text-[#e74c3c]" role="alert">
              {errors.client_id}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-[#2c3e50] mb-1"
            >
              Status <span className="text-[#e74c3c]">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={isSubmitting}
              className={`
                w-full px-3 py-2 border rounded min-h-[44px]
                ${errors.status ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:bg-gray-100 disabled:cursor-not-allowed
              `}
              aria-required="true"
              aria-invalid={!!errors.status}
              aria-describedby={errors.status ? 'status-error' : undefined}
            >
              <option value="planning">Planning</option>
              <option value="development">Development</option>
              <option value="honey-period">Honey Period</option>
              <option value="retainer">Retainer</option>
              <option value="completed">Completed</option>
            </select>
            {errors.status && (
              <p id="status-error" className="mt-1 text-sm text-[#e74c3c]" role="alert">
                {errors.status}
              </p>
            )}
          </div>

          <div className="w-full">
            <label
              htmlFor="project_type"
              className="block text-sm font-medium text-[#2c3e50] mb-1"
            >
              Project Type <span className="text-[#e74c3c]">*</span>
            </label>
            <select
              id="project_type"
              value={formData.project_type}
              onChange={(e) => handleChange('project_type', e.target.value)}
              disabled={isSubmitting}
              className={`
                w-full px-3 py-2 border rounded min-h-[44px]
                ${errors.project_type ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:bg-gray-100 disabled:cursor-not-allowed
              `}
              aria-required="true"
              aria-invalid={!!errors.project_type}
              aria-describedby={errors.project_type ? 'project_type-error' : undefined}
            >
              <option value="website">Website Development</option>
              <option value="ecommerce">E-commerce</option>
              <option value="custom">Custom Application</option>
              <option value="misc_it">Miscellaneous IT</option>
              <option value="maintenance">Maintenance/Support</option>
              <option value="consulting">Consulting</option>
            </select>
            {errors.project_type && (
              <p id="project_type-error" className="mt-1 text-sm text-[#e74c3c]" role="alert">
                {errors.project_type}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            error={errors.start_date}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Support Months"
            type="number"
            value={formData.support_months.toString()}
            onChange={(e) => handleChange('support_months', parseInt(e.target.value) || 0)}
            error={errors.support_months}
            required
            disabled={isSubmitting}
            placeholder="6"
            min="0"
            max="60"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-[#2c3e50] mb-1">
            Support End Date
          </label>
          <input
            type="date"
            value={formData.support_end_date}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-[#7f8c8d] cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-[#7f8c8d]">
            Automatically calculated from start date and support months
          </p>
        </div>

        <div className="w-full">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-[#2c3e50] mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter project description (optional)"
            rows={4}
            className={`
              w-full px-3 py-2 border rounded
              ${errors.description ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-[#e74c3c]" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-[#2c3e50] mb-1">
            Tech Stack
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              onKeyDown={handleTechStackKeyDown}
              disabled={isSubmitting}
              placeholder="Add technology (e.g., React, Node.js)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ffd166] disabled:bg-gray-100"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddTechStack}
              disabled={isSubmitting || !techStackInput.trim()}
            >
              Add
            </Button>
          </div>
          {formData.tech_stack && formData.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tech_stack.map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#3498db] text-white rounded-full text-sm"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTechStack(index)}
                    disabled={isSubmitting}
                    className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                    aria-label={`Remove ${tech}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Live URL"
          type="url"
          value={formData.live_url}
          onChange={(e) => handleChange('live_url', e.target.value)}
          error={errors.live_url}
          disabled={isSubmitting}
          placeholder="https://example.com"
        />

        <Input
          label="GitHub URL"
          type="url"
          value={formData.github_url}
          onChange={(e) => handleChange('github_url', e.target.value)}
          error={errors.github_url}
          disabled={isSubmitting}
          placeholder="https://github.com/user/repo"
        />

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-[#2c3e50] mb-3">Additional URLs</h3>
          <div className="space-y-4">
            <Input
              label="Repository URL"
              type="url"
              value={formData.repo_url}
              onChange={(e) => handleChange('repo_url', e.target.value)}
              error={errors.repo_url}
              disabled={isSubmitting}
              placeholder="https://github.com/user/repo or https://gitlab.com/user/repo"
            />

            <Input
              label="Staging URL"
              type="url"
              value={formData.staging_url}
              onChange={(e) => handleChange('staging_url', e.target.value)}
              error={errors.staging_url}
              disabled={isSubmitting}
              placeholder="https://staging.example.com"
            />

            <Input
              label="Production URL"
              type="url"
              value={formData.production_url}
              onChange={(e) => handleChange('production_url', e.target.value)}
              error={errors.production_url}
              disabled={isSubmitting}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-[#2c3e50] mb-3">Pricing Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Labour %"
              type="number"
              value={formData.labour_percentage?.toString() || '30'}
              onChange={(e) => handleChange('labour_percentage', parseInt(e.target.value) || 30)}
              error={errors.labour_percentage}
              disabled={isSubmitting}
              placeholder="30"
              min="0"
              max="100"
            />

            <Input
              label="Labour Amount (R)"
              type="number"
              value={formData.labour_amount?.toString() || ''}
              onChange={(e) => handleChange('labour_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
              disabled={isSubmitting}
              placeholder="0.00"
              min="0"
              step="0.01"
            />

            <Input
              label="Infrastructure Amount (R)"
              type="number"
              value={formData.infrastructure_amount?.toString() || ''}
              onChange={(e) => handleChange('infrastructure_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
              disabled={isSubmitting}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={hasErrors && !isSubmitting}
          >
            {project ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
