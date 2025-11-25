import { useState, useMemo, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import { Table, type Column } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import ProjectForm from '../components/projects/ProjectForm';
import ProjectDetail from '../components/projects/ProjectDetail';
import { useProjects, useDeleteProject } from '../hooks/useProjects';
import type { Project } from '../types/database';
import { Plus, Search, Eye, Edit, Trash2, Briefcase, AlertTriangle } from 'lucide-react';
import { getDaysUntilSupportEnds, isSupportExpiringSoon, formatDate } from '../lib/utils';

interface OutletContext {
  onMenuClick: () => void;
}

const Projects = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((project) => project.status === filterStatus);
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((project) => project.project_type === filterType);
    }

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.client?.business.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortKey as keyof Project];
      let bValue: any = b[sortKey as keyof Project];

      // Handle nested client business name
      if (sortKey === 'client_name') {
        aValue = a.client?.business || '';
        bValue = b.client?.business || '';
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [projects, debouncedSearch, filterStatus, filterType, sortKey, sortDirection]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);

  const handleAddProject = useCallback(() => {
    setSelectedProject(null);
    setIsFormOpen(true);
  }, []);

  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  }, []);

  const handleViewProject = useCallback((project: Project) => {
    setSelectedProjectId(project.id);
    setIsDetailOpen(true);
  }, []);

  const handleDeleteClick = useCallback((project: Project) => {
    setProjectToDelete(project);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject.mutateAsync(projectToDelete.id);
      setProjectToDelete(null);
    } catch (error) {
      // Error is handled in the hook
      setProjectToDelete(null);
    }
  }, [projectToDelete, deleteProject]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterType('all');
  }, []);

  const hasActiveFilters = searchQuery || filterStatus !== 'all' || filterType !== 'all';

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (project) => (
        <div>
          <p className="font-medium text-[#2c3e50]">{project.name}</p>
          <p className="text-sm text-[#7f8c8d]">{project.client?.business}</p>
          {project.project_type && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-[#3498db] bg-opacity-10 text-[#3498db]">
              {project.project_type === 'misc_it' ? 'Misc IT' : 
               project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1).replace('_', ' ')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (project) => (
        <StatusBadge status={project.status} variant="project" />
      ),
    },
    {
      key: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (project) => formatDate(project.start_date),
    },
    {
      key: 'support_end_date',
      label: 'Support End',
      sortable: true,
      render: (project) => {
        const daysUntil = getDaysUntilSupportEnds(project.support_end_date);
        const isExpiring = isSupportExpiringSoon(project.support_end_date);
        const isExpired = daysUntil < 0;

        return (
          <div className="flex items-center gap-2">
            {isExpiring && !isExpired && (
              <AlertTriangle size={16} className="text-[#f39c12]" aria-label="Support expiring soon" />
            )}
            <div>
              <p className={`text-sm ${isExpired ? 'text-[#7f8c8d]' : 'text-[#2c3e50]'}`}>
                {formatDate(project.support_end_date)}
              </p>
              <p className={`text-xs ${isExpired ? 'text-[#e74c3c]' : isExpiring ? 'text-[#f39c12]' : 'text-[#7f8c8d]'}`}>
                {isExpired 
                  ? `Expired ${Math.abs(daysUntil)} days ago`
                  : `${daysUntil} days remaining`
                }
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (project) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewProject(project)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="View project details"
            title="View details"
          >
            <Eye size={18} className="text-[#3498db]" />
          </button>
          <button
            onClick={() => handleEditProject(project)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Edit project"
            title="Edit"
          >
            <Edit size={18} className="text-[#f39c12]" />
          </button>
          <button
            onClick={() => handleDeleteClick(project)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Delete project"
            title="Delete"
          >
            <Trash2 size={18} className="text-[#e74c3c]" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header title="Projects" onMenuClick={onMenuClick} />
      <div className="p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-xs">
                  <Input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-h-[44px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="development">Development</option>
                  <option value="honey-period">Honey Period</option>
                  <option value="retainer">Retainer</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-h-[44px]"
                >
                  <option value="all">All Types</option>
                  <option value="website">Website</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="custom">Custom App</option>
                  <option value="misc_it">Misc IT</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="consulting">Consulting</option>
                </select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
              <Button
                variant="primary"
                icon={<Plus size={18} />}
                onClick={handleAddProject}
              >
                New Project
              </Button>
            </div>
          </div>

          {/* Table or Empty State */}
          <div className="p-4">
            {projects.length === 0 && !isLoading ? (
              <EmptyState
                icon={<Briefcase size={64} />}
                title="No projects yet"
                description="Get started by adding your first project"
                action={
                  <Button
                    variant="primary"
                    icon={<Plus size={18} />}
                    onClick={handleAddProject}
                  >
                    Add Your First Project
                  </Button>
                }
              />
            ) : filteredProjects.length === 0 && !isLoading ? (
              <EmptyState
                icon={<Search size={64} />}
                title="No results found"
                description={`No projects match "${debouncedSearch}". Try a different search term.`}
                action={
                  <Button variant="secondary" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                }
              />
            ) : (
              <Table
                columns={columns}
                data={filteredProjects}
                onSort={handleSort}
                sortKey={sortKey}
                sortDirection={sortDirection}
                loading={isLoading}
                emptyMessage="No projects found"
              />
            )}
          </div>
        </div>
      </div>

      {/* Project Form Modal */}
      <ProjectForm
        project={selectedProject}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProject(null);
        }}
      />

      {/* Project Detail Modal */}
      <ProjectDetail
        projectId={selectedProjectId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProjectId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setProjectToDelete(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Delete Project
            </h3>
            <p className="text-[#7f8c8d] mb-6">
              Are you sure you want to delete <strong>{projectToDelete.name}</strong>?
              This action cannot be undone. Associated invoices will have their project
              reference removed.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setProjectToDelete(null)}
                disabled={deleteProject.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={deleteProject.isPending}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
