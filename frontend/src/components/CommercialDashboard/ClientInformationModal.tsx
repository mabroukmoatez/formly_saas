import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { InseeSearchInput } from './InseeSearchInput';
import { commercialService } from '../../services/commercial';
import { InvoiceClient } from '../../services/commercial.types';

interface ClientInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: InvoiceClient | any) => void;
  existingClient?: InvoiceClient | null;
}

export const ClientInformationModal: React.FC<ClientInformationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingClient,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();

  const [clientType, setClientType] = useState<'professional' | 'individual'>('professional');
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    zip_code: '',
    city: '',
    country: 'France',
    siret: '',
    vat_number: '',
    type: 'professional',
  });
  const [clientSearch, setClientSearch] = useState('');
  const [clientHistory, setClientHistory] = useState<InvoiceClient[]>([]);
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset search states when modal opens
      setClientSearch('');
      setShowClientHistory(false);
      setClientHistory([]);

      if (existingClient) {
        setClientType(existingClient.type === 'private' ? 'individual' : 'professional');
        setFormData({
          company_name: existingClient.company_name || '',
          first_name: existingClient.first_name || '',
          last_name: existingClient.last_name || '',
          email: existingClient.email || '',
          phone: existingClient.phone || '',
          address: existingClient.address || '',
          zip_code: existingClient.zip_code || '',
          city: existingClient.city || '',
          country: existingClient.country || 'France',
          siret: existingClient.siret || '',
          vat_number: '',
          type: existingClient.type || 'professional',
        });
      } else {
        // Reset to default form when no existing client
        setClientType('professional');
        setFormData({
          company_name: '',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address: '',
          zip_code: '',
          city: '',
          country: 'France',
          siret: '',
          vat_number: '',
          type: 'professional',
        });
      }
    }
  }, [existingClient, isOpen]);

  // Load client history when search changes
  useEffect(() => {
    const loadClientHistory = async () => {
      if (clientSearch.length < 2) {
        setClientHistory([]);
        setLoadingClients(false);
        return;
      }

      try {
        setLoadingClients(true);
        const response = await commercialService.getClients({
          page: 1,
          per_page: 10,
          search: clientSearch,
        });

        if (response.success && response.data) {
          const clients = response.data.data || [];
          setClientHistory(clients.filter((c: InvoiceClient) =>
            clientType === 'professional' ? c.type !== 'private' : c.type === 'private'
          ));
        }
      } catch (err) {
        console.error('Error loading client history:', err);
      } finally {
        setLoadingClients(false);
      }
    };

    const debounce = setTimeout(() => {
      loadClientHistory();
    }, 300);

    return () => clearTimeout(debounce);
  }, [clientSearch, clientType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowClientHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInseeSelect = (company: any) => {
    setFormData({
      ...formData,
      company_name: company.company_name || '',
      address: company.address || '',
      zip_code: company.postal_code || '',
      city: company.city || '',
      siret: company.siret || '',
      vat_number: company.tva_number || '',
    });
  };

  const handleClientSelect = (client: InvoiceClient) => {
    setFormData({
      company_name: client.company_name || '',
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      zip_code: client.zip_code || '',
      city: client.city || '',
      country: client.country || 'France',
      siret: client.siret || '',
      vat_number: '',
      type: client.type || 'professional',
    });
    setClientSearch('');
    setShowClientHistory(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (existingClient?.id) {
        const updated = await commercialService.updateClient(
          String(existingClient.id),
          {
            ...formData,
            type: clientType === 'individual' ? 'private' : 'professional',
          }
        );
        if (updated.success && updated.data) {
          onSave(updated.data);
        }
      } else {
        const created = await commercialService.createClient({
          ...formData,
          type: clientType === 'individual' ? 'private' : 'professional',
          organization_id: organization?.id || 0,
        });
        if (created.success && created.data) {
          onSave(created.data);
        }
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving client:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <Card className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[18px] bg-white border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] font-['Poppins',sans-serif]">
          <div className="flex flex-col gap-6">
            {/* Header with Toggle */}
            <div className="bg-white border border-gray-200 rounded-[5px] flex flex-col gap-[10px] h-[60px] items-center justify-center px-0 py-[9px]">
              <p className="text-[17px] font-semibold text-[#19294a]">
                Quelles sont les coordonnées de votre client ?
              </p>
              <div className="flex gap-4 items-center">
                <p className={`text-[14px] font-bold capitalize ${clientType === 'professional' ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>
                  Client professionnel
                </p>
                <button
                  onClick={() => setClientType(clientType === 'professional' ? 'individual' : 'professional')}
                  className={`relative h-[19.451px] w-[37.929px] rounded-[9.725px] transition-colors ${
                    clientType === 'individual' ? 'bg-[#007aff]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-[0.69px] size-[17.506px] bg-white rounded-full shadow-[0px_0px_2.188px_0px_inset_rgba(0,0,0,0.25)] transition-transform ${
                      clientType === 'individual' ? 'translate-x-[18.95px]' : 'translate-x-[1px]'
                    }`}
                  />
                </button>
                <p className={`text-[14px] font-bold capitalize ${clientType === 'individual' ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>
                  Client particulier
                </p>
              </div>
            </div>

            {/* Professional Client Fields */}
            {clientType === 'professional' && (
              <>
                {/* L'ENTREPRISE Section */}
                <div className="flex flex-col gap-4">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">L'entreprise</p>

                  {/* Client Search with Autocomplete */}
                  <div className="relative" ref={searchRef}>
                    <div className="bg-white rounded-[8px] h-[44px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px] gap-2">
                        <Search className="w-4 h-4 text-[#6a90ba]" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setShowClientHistory(true);
                          }}
                          onFocus={() => setShowClientHistory(true)}
                          placeholder="Rechercher un client existant..."
                          className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#19294a] placeholder:text-[#6a90ba]"
                          autoComplete="off"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>

                    {/* Client History Dropdown */}
                    {showClientHistory && (loadingClients || clientHistory.length > 0) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#ebf1ff] rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto z-10">
                        {loadingClients ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 text-[#6a90ba] animate-spin" />
                            <p className="ml-2 text-[13px] text-[#6a90ba]">Recherche en cours...</p>
                          </div>
                        ) : (
                          clientHistory.map((client) => (
                            <button
                              key={client.id}
                              onClick={() => handleClientSelect(client)}
                              className="w-full px-4 py-2 text-left hover:bg-[#ebf1ff] transition-colors flex flex-col gap-1"
                            >
                              <p className="text-[13px] font-semibold text-[#19294a]">
                                {client.company_name || `${client.first_name} ${client.last_name}`}
                              </p>
                              <p className="text-[11px] text-[#6a90ba]">
                                {client.email} • {client.siret || 'Pas de SIRET'}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Company Name and SIRET */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-white rounded-[8px] h-[44px] relative">
                      <div className="flex flex-col gap-[8px] h-full justify-center px-[14px] py-[10px]">
                        <p className="text-[13px] text-[#6a90ba]">Raison Social</p>
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          className="text-[13px] text-[#19294a] bg-transparent border-none outline-none w-full leading-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>

                    <div className="flex-1 bg-white rounded-[8px] h-[44px] relative">
                      <div className="flex flex-col gap-[8px] h-full justify-center px-[14px] py-[10px]">
                        <p className="text-[13px] text-[#6a90ba] uppercase">Siret</p>
                        <input
                          type="text"
                          value={formData.siret}
                          onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                          className="text-[13px] text-[#19294a] bg-transparent border-none outline-none w-full leading-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>
                  </div>

                  {/* INSEE Search */}
                  <div className="text-[12px] text-[#6a90ba]">
                    <InseeSearchInput onSelect={handleInseeSelect} />
                  </div>
                </div>

                {/* ADRESSE Section */}
                <div className="flex flex-col gap-4">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">Adresse</p>

                  {/* Address */}
                  <div className="bg-white rounded-[8px] relative">
                    <div className="flex items-center h-full px-[14px] py-[10px]">
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Adresse"
                        className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                      />
                    </div>
                    <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                  </div>

                  {/* City and Postal Code */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-white rounded-[8px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px]">
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Ville"
                          className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>

                    <div className="flex-1 bg-white rounded-[8px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px]">
                        <input
                          type="text"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                          placeholder="Code postal"
                          className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>
                  </div>
                </div>

                {/* COORDONNÉES Section */}
                <div className="flex flex-col gap-4">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">Coordonnées</p>

                  {/* Email and Phone */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-white rounded-[8px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px]">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Email"
                          className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>

                    <div className="flex-1 bg-white rounded-[8px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px]">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Téléphone"
                          className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Individual Client Fields */}
            {clientType === 'individual' && (
              <>
                {/* INFORMATIONS PERSONNELLES Section */}
                <div className="flex flex-col gap-4">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">Informations personnelles</p>

                  {/* Client Search */}
                  <div className="relative" ref={searchRef}>
                    <div className="bg-white rounded-[8px] h-[44px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px] gap-2">
                        <Search className="w-4 h-4 text-[#6a90ba]" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setShowClientHistory(true);
                          }}
                          onFocus={() => setShowClientHistory(true)}
                          placeholder="Rechercher un client existant..."
                          className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#19294a] placeholder:text-[#6a90ba]"
                          autoComplete="off"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>

                    {/* Client History Dropdown */}
                    {showClientHistory && (loadingClients || clientHistory.length > 0) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#ebf1ff] rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto z-10">
                        {loadingClients ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 text-[#6a90ba] animate-spin" />
                            <p className="ml-2 text-[13px] text-[#6a90ba]">Recherche en cours...</p>
                          </div>
                        ) : (
                          clientHistory.map((client) => (
                            <button
                              key={client.id}
                              onClick={() => handleClientSelect(client)}
                              className="w-full px-4 py-2 text-left hover:bg-[#ebf1ff] transition-colors flex flex-col gap-1"
                            >
                              <p className="text-[13px] font-semibold text-[#19294a]">
                                {client.first_name} {client.last_name}
                              </p>
                              <p className="text-[11px] text-[#6a90ba]">
                                {client.email} • {client.phone || 'Pas de téléphone'}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* First Name and Last Name */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-white rounded-[8px] h-[44px] relative">
                      <div className="flex flex-col gap-[8px] h-full justify-center px-[14px] py-[10px]">
                        <p className="text-[13px] text-[#6a90ba]">Prénom</p>
                        <input
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="text-[13px] text-[#19294a] bg-transparent border-none outline-none w-full leading-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>

                    <div className="flex-1 bg-white rounded-[8px] h-[44px] relative">
                      <div className="flex flex-col gap-[8px] h-full justify-center px-[14px] py-[10px]">
                        <p className="text-[13px] text-[#6a90ba]">Nom</p>
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="text-[13px] text-[#19294a] bg-transparent border-none outline-none w-full leading-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>
                  </div>
                </div>

                {/* ADRESSE Section */}
                <div className="flex flex-col gap-4">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">Adresse</p>

                  <div className="bg-white rounded-[8px] relative">
                    <div className="flex items-center h-full px-[14px] py-[10px]">
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Adresse"
                        className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                      />
                    </div>
                    <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 bg-white rounded-[8px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px]">
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Ville"
                          className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>

                    <div className="flex-1 bg-white rounded-[8px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px]">
                        <input
                          type="text"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                          placeholder="Code postal"
                          className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>
                  </div>
                </div>

                {/* COORDONNÉES Section */}
                <div className="flex flex-col gap-4">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">Coordonnées</p>

                  <div className="flex gap-4">
                    <div className="flex-1 bg-white rounded-[8px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px]">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Email"
                          className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>

                    <div className="flex-1 bg-white rounded-[8px] relative">
                      <div className="flex items-center h-full px-[14px] py-[10px]">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Téléphone"
                          className="flex-1 text-[14px] text-[#19294a] placeholder:text-[#6a90ba] bg-transparent border-none outline-none"
                        />
                      </div>
                      <div className="absolute border border-[#ebf1ff] inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="border border-[#6a90ba] rounded-[10px] px-4 h-[40px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="text-[13px] font-medium text-[#7e8ca9] capitalize">annuler</p>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#ff7700] rounded-[10px] px-6 h-[40px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <p className="text-[13px] font-medium text-white capitalize">
              {saving ? 'Enregistrement...' : 'enregistrer'}
            </p>
          </button>
        </div>
      </Card>
    </div>
  );
};
