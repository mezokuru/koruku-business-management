import { Modal } from '../ui/Modal';
import { useClient } from '../../hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { Building2, User, Mail, Phone, MapPin, FileText, Briefcase, DollarSign, Loader2 } from 'lucide-react';
import type { Project, Invoice } from '../../types/database';

interface ClientDetailProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientDetail({ clientId, isOpen, onClose }: ClientDetailProps) {
  const { data: client, isLoading: clientLoading } = useClient(clientId || undefined);

  // Fetch projects for this client
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', { clientId }],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!clientId && isOpen,
  });

  // Fetch invoices for this client
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', { clientId }],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!clientId && isOpen,
  });

  // Calculate revenue
  const totalRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const outstandingAmount = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const isLoading = clientLoading || projectsLoading || invoicesLoading;

  if (!clientId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Client Details" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[#ffd166]" size={32} />
        </div>
      ) : client ? (
        <div className="space-y-6">
          {/* Client Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Client Information
            </h3>
            
            <div className="flex items-start gap-3">
              <Building2 size={18} className="text-[#7f8c8d] mt-0.5" />
              <div>
                <p className="text-sm text-[#7f8c8d]">Business</p>
                <p className="text-base font-medium text-[#2c3e50]">{client.business}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User size={18} className="text-[#7f8c8d] mt-0.5" />
              <div>
                <p className="text-sm text-[#7f8c8d]">Contact Person</p>
                <p className="text-base font-medium text-[#2c3e50]">{client.contact}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={18} className="text-[#7f8c8d] mt-0.5" />
              <div>
                <p className="text-sm text-[#7f8c8d]">Email</p>
                <p className="text-base font-medium text-[#2c3e50]">
                  <a href={`mailto:${client.email}`} className="hover:text-[#ffd166]">
                    {client.email}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={18} className="text-[#7f8c8d] mt-0.5" />
              <div>
                <p className="text-sm text-[#7f8c8d]">Phone</p>
                <p className="text-base font-medium text-[#2c3e50]">
                  <a href={`tel:${client.phone}`} className="hover:text-[#ffd166]">
                    {client.phone}
                  </a>
                </p>
              </div>
            </div>

            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#7f8c8d] mt-0.5" />
                <div>
                  <p className="text-sm text-[#7f8c8d]">Address</p>
                  <p className="text-base font-medium text-[#2c3e50]">{client.address}</p>
                </div>
              </div>
            )}

            {client.notes && (
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-[#7f8c8d] mt-0.5" />
                <div>
                  <p className="text-sm text-[#7f8c8d]">Notes</p>
                  <p className="text-base font-medium text-[#2c3e50] whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  client.active
                    ? 'bg-[#27ae60] text-white'
                    : 'bg-[#7f8c8d] text-white'
                }`}
              >
                {client.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-[#27ae60]" />
                <p className="text-sm text-[#7f8c8d]">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold text-[#2c3e50]">
                {formatCurrency(totalRevenue)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-[#f39c12]" />
                <p className="text-sm text-[#7f8c8d]">Outstanding</p>
              </div>
              <p className="text-2xl font-bold text-[#2c3e50]">
                {formatCurrency(outstandingAmount)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={18} className="text-[#3498db]" />
                <p className="text-sm text-[#7f8c8d]">Projects</p>
              </div>
              <p className="text-2xl font-bold text-[#2c3e50]">{projects.length}</p>
            </div>
          </div>

          {/* Projects */}
          <div>
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Projects ({projects.length})
            </h3>
            {projects.length > 0 ? (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-gray-50 rounded p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-[#2c3e50]">{project.name}</p>
                      <p className="text-sm text-[#7f8c8d]">
                        Status: {project.status.replace('-', ' ')}
                      </p>
                    </div>
                    <p className="text-sm text-[#7f8c8d]">
                      {new Date(project.start_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7f8c8d] italic">No projects yet</p>
            )}
          </div>

          {/* Invoices */}
          <div>
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Invoices ({invoices.length})
            </h3>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.slice(0, 5).map((invoice) => (
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
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {invoices.length > 5 && (
                  <p className="text-sm text-[#7f8c8d] italic text-center pt-2">
                    And {invoices.length - 5} more...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#7f8c8d] italic">No invoices yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[#7f8c8d]">
          Client not found
        </div>
      )}
    </Modal>
  );
}
