import { useState, useMemo, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import { Table, type Column } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import ClientForm from '../components/clients/ClientForm';
import ClientDetail from '../components/clients/ClientDetail';
import { useClients, useDeleteClient, useUpdateClient } from '../hooks/useClients';
import type { Client } from '../types/database';
import { Plus, Search, Eye, Edit, Trash2, UserX, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface OutletContext {
  onMenuClick: () => void;
}

const Clients = () => {
  const { onMenuClick } = useOutletContext<OutletContext>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<string>('business');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useClients(false);
  const deleteClient = useDeleteClient();
  const updateClient = useUpdateClient();

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and search clients
  const filteredClients = useMemo(() => {
    let filtered = [...clients];

    // Apply active filter
    if (filterActive === 'active') {
      filtered = filtered.filter((client) => client.active);
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter((client) => !client.active);
    }

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.business.toLowerCase().includes(query) ||
          client.contact.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortKey as keyof Client];
      const bValue = b[sortKey as keyof Client];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [clients, debouncedSearch, filterActive, sortKey, sortDirection]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);

  const handleAddClient = useCallback(() => {
    setSelectedClient(null);
    setIsFormOpen(true);
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  }, []);

  const handleViewClient = useCallback((client: Client) => {
    setSelectedClientId(client.id);
    setIsDetailOpen(true);
  }, []);

  const handleDeleteClick = useCallback((client: Client) => {
    setClientToDelete(client);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!clientToDelete) return;

    try {
      await deleteClient.mutateAsync(clientToDelete.id);
      setClientToDelete(null);
    } catch (error) {
      // Error is handled in the hook
      setClientToDelete(null);
    }
  }, [clientToDelete, deleteClient]);

  const handleMarkInactive = useCallback(async (client: Client) => {
    try {
      await updateClient.mutateAsync({
        id: client.id,
        active: false,
      });
      toast.success('Client marked as inactive');
    } catch (error) {
      // Error is handled in the hook
    }
  }, [updateClient]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterActive('all');
  }, []);

  const hasActiveFilters = searchQuery || filterActive !== 'all';

  const columns: Column<Client>[] = [
    {
      key: 'business',
      label: 'Business',
      sortable: true,
      render: (client) => (
        <div>
          <p className="font-medium text-[#2c3e50]">{client.business}</p>
          <p className="text-sm text-[#7f8c8d]">{client.contact}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (client) => (
        <a
          href={`mailto:${client.email}`}
          className="text-[#2c3e50] hover:text-[#ffd166]"
        >
          {client.email}
        </a>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (client) => (
        <a
          href={`tel:${client.phone}`}
          className="text-[#2c3e50] hover:text-[#ffd166]"
        >
          {client.phone}
        </a>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      sortable: true,
      render: (client) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            client.active
              ? 'bg-[#27ae60] text-white'
              : 'bg-[#7f8c8d] text-white'
          }`}
        >
          {client.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (client) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewClient(client)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="View client details"
            title="View details"
          >
            <Eye size={18} className="text-[#3498db]" />
          </button>
          <button
            onClick={() => handleEditClient(client)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Edit client"
            title="Edit"
          >
            <Edit size={18} className="text-[#f39c12]" />
          </button>
          {client.active ? (
            <button
              onClick={() => handleMarkInactive(client)}
              className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Mark as inactive"
              title="Mark as inactive"
            >
              <UserX size={18} className="text-[#7f8c8d]" />
            </button>
          ) : null}
          <button
            onClick={() => handleDeleteClick(client)}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Delete client"
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
      <Header title="Clients" onMenuClick={onMenuClick} />
      <div className="p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-xs">
                  <Input
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                  />
                </div>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-h-[44px]"
                >
                  <option value="all">All Clients</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
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
                onClick={handleAddClient}
              >
                Add Client
              </Button>
            </div>
          </div>

          {/* Table or Empty State */}
          <div className="p-4">
            {clients.length === 0 && !isLoading ? (
              <EmptyState
                icon={<Users size={64} />}
                title="No clients yet"
                description="Get started by adding your first client"
                action={
                  <Button
                    variant="primary"
                    icon={<Plus size={18} />}
                    onClick={handleAddClient}
                  >
                    Add Your First Client
                  </Button>
                }
              />
            ) : filteredClients.length === 0 && !isLoading ? (
              <EmptyState
                icon={<Search size={64} />}
                title="No results found"
                description={`No clients match "${debouncedSearch}". Try a different search term.`}
                action={
                  <Button variant="secondary" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                }
              />
            ) : (
              <Table
                columns={columns}
                data={filteredClients}
                onSort={handleSort}
                sortKey={sortKey}
                sortDirection={sortDirection}
                loading={isLoading}
                emptyMessage="No clients found"
              />
            )}
          </div>
        </div>
      </div>

      {/* Client Form Modal */}
      <ClientForm
        client={selectedClient}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedClient(null);
        }}
      />

      {/* Client Detail Modal */}
      <ClientDetail
        clientId={selectedClientId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedClientId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {clientToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setClientToDelete(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Delete Client
            </h3>
            <p className="text-[#7f8c8d] mb-6">
              Are you sure you want to delete <strong>{clientToDelete.business}</strong>?
              This action cannot be undone. If this client has associated projects or
              invoices, consider marking them as inactive instead.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setClientToDelete(null)}
                disabled={deleteClient.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={deleteClient.isPending}
              >
                Delete Client
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
