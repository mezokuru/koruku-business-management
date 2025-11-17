import { Modal } from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { useProject } from '../../hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDate, getDaysUntilSupportEnds, isSupportExpiringSoon } from '../../lib/utils';
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Code, 
  ExternalLink, 
  Github,
  Building2,
  Mail,
  Phone,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { Invoice } from '../../types/database';

interface ProjectDetailProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectDetail({ projectId, isOpen, onClose }: ProjectDetailProps) {
  const { data: project, isLoading: projectLoading } = useProject(projectId || undefined);

  // Fetch invoices for this project
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', { projectId }],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!projectId && isOpen,
  });

  const isLoading = projectLoading || invoicesLoading;

  if (!projectId) return null;

  const daysUntil = project ? getDaysUntilSupportEnds(project.support_end_date) : 0;
  const isExpiring = project ? isSupportExpiringSoon(project.support_end_date) : false;
  const isExpired = daysUntil < 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Details" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[#ffd166]" size={32} />
        </div>
      ) : project ? (
        <div className="space-y-6">
          {/* Project Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-1">
                  {project.name}
                </h3>
                <StatusBadge status={project.status} variant="project" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-[#7f8c8d] mt-0.5" />
              <div>
                <p className="text-sm text-[#7f8c8d]">Start Date</p>
                <p className="text-base font-medium text-[#2c3e50]">
                  {formatDate(project.start_date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={18} className="text-[#7f8c8d] mt-0.5" />
              <div>
                <p className="text-sm text-[#7f8c8d]">Support Period</p>
                <p className="text-base font-medium text-[#2c3e50]">
                  {project.support_months} months
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {isExpiring && !isExpired && (
                <AlertTriangle size={18} className="text-[#f39c12] mt-0.5" />
              )}
              {!isExpiring && !isExpired && (
                <Calendar size={18} className="text-[#7f8c8d] mt-0.5" />
              )}
              {isExpired && (
                <Calendar size={18} className="text-[#e74c3c] mt-0.5" />
              )}
              <div>
                <p className="text-sm text-[#7f8c8d]">Support End Date</p>
                <p className={`text-base font-medium ${isExpired ? 'text-[#e74c3c]' : 'text-[#2c3e50]'}`}>
                  {formatDate(project.support_end_date)}
                </p>
                <p className={`text-sm ${isExpired ? 'text-[#e74c3c]' : isExpiring ? 'text-[#f39c12]' : 'text-[#7f8c8d]'}`}>
                  {isExpired 
                    ? `Expired ${Math.abs(daysUntil)} days ago`
                    : `${daysUntil} days remaining`
                  }
                </p>
              </div>
            </div>

            {project.description && (
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-[#7f8c8d] mt-0.5" />
                <div>
                  <p className="text-sm text-[#7f8c8d]">Description</p>
                  <p className="text-base font-medium text-[#2c3e50] whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              </div>
            )}

            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="flex items-start gap-3">
                <Code size={18} className="text-[#7f8c8d] mt-0.5" />
                <div>
                  <p className="text-sm text-[#7f8c8d] mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech_stack.map((tech: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-[#3498db] text-white rounded-full text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {project.live_url && (
              <div className="flex items-start gap-3">
                <ExternalLink size={18} className="text-[#7f8c8d] mt-0.5" />
                <div>
                  <p className="text-sm text-[#7f8c8d]">Live URL</p>
                  <p className="text-base font-medium text-[#2c3e50]">
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#ffd166] inline-flex items-center gap-1"
                    >
                      {project.live_url}
                      <ExternalLink size={14} />
                    </a>
                  </p>
                </div>
              </div>
            )}

            {project.github_url && (
              <div className="flex items-start gap-3">
                <Github size={18} className="text-[#7f8c8d] mt-0.5" />
                <div>
                  <p className="text-sm text-[#7f8c8d]">GitHub Repository</p>
                  <p className="text-base font-medium text-[#2c3e50]">
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#ffd166] inline-flex items-center gap-1"
                    >
                      {project.github_url}
                      <ExternalLink size={14} />
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Client Information */}
          {project.client && (
            <div>
              <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
                Client Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="text-[#7f8c8d] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#7f8c8d]">Business</p>
                    <p className="text-base font-medium text-[#2c3e50]">
                      {project.client.business}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User size={18} className="text-[#7f8c8d] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#7f8c8d]">Contact Person</p>
                    <p className="text-base font-medium text-[#2c3e50]">
                      {project.client.contact}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-[#7f8c8d] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#7f8c8d]">Email</p>
                    <p className="text-base font-medium text-[#2c3e50]">
                      <a href={`mailto:${project.client.email}`} className="hover:text-[#ffd166]">
                        {project.client.email}
                      </a>
                    </p>
                  </div>
                </div>

                {project.client.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-[#7f8c8d] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#7f8c8d]">Phone</p>
                      <p className="text-base font-medium text-[#2c3e50]">
                        <a href={`tel:${project.client.phone}`} className="hover:text-[#ffd166]">
                          {project.client.phone}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Invoices */}
          <div>
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Related Invoices ({invoices.length})
            </h3>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-gray-50 rounded p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-[#2c3e50]">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-sm text-[#7f8c8d]">
                        Status: {invoice.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#2c3e50]">
                        {formatCurrency(invoice.amount)}
                      </p>
                      <p className="text-sm text-[#7f8c8d]">
                        {formatDate(invoice.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7f8c8d] italic">No invoices for this project yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[#7f8c8d]">
          Project not found
        </div>
      )}
    </Modal>
  );
}
