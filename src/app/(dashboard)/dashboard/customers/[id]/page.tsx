'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { Customer, Dealroom, TeamMember } from '@/types/database';
import { ArrowLeft, Phone, Mail, MapPin, Plus, Loader2, Check, Eye, Users, Upload, ImageIcon } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-amber-100 text-amber-700' },
  published: { label: 'Live', color: 'bg-emerald-100 text-emerald-700' },
  signed: { label: 'Signiert', color: 'bg-blue-100 text-blue-700' },
  inactive: { label: 'Inaktiv', color: 'bg-gray-100 text-gray-500' },
  archived: { label: 'Archiviert', color: 'bg-gray-100 text-gray-500' },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [dealrooms, setDealrooms] = useState<Dealroom[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Editable fields
  const [salutation, setSalutation] = useState<'Herr' | 'Frau'>('Herr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');

  const fetchData = useCallback(async () => {
    const [{ data: c }, { data: d }, { data: members }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', params.id).single(),
      supabase.from('dealrooms').select('*').eq('customer_id', params.id).order('created_at', { ascending: false }),
      supabase.from('team_members').select('*').eq('is_active', true).order('name'),
    ]);

    if (c) {
      const cust = c as Customer;
      setCustomer(cust);
      setSalutation(cust.salutation);
      setFirstName(cust.first_name);
      setLastName(cust.last_name);
      setCompany(cust.company);
      setPosition(cust.position || '');
      setEmail(cust.email || '');
      setPhone(cust.phone || '');
      setAddress(cust.address || '');
      setNotes(cust.notes || '');
      setLogoUrl(cust.logo_url || '');
      setAssignedMemberId(cust.assigned_member_id || '');
    }
    setTeamMembers((members as TeamMember[]) || []);
    setDealrooms((d as Dealroom[]) || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaveStatus('saving');
    const { error } = await supabase
      .from('customers')
      .update({
        salutation,
        first_name: firstName,
        last_name: lastName,
        company,
        position: position || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        logo_url: logoUrl || null,
        assigned_member_id: assignedMemberId && assignedMemberId !== 'none' ? assignedMemberId : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (error) {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    } else {
      setSaveStatus('saved');
      setEditing(false);
      setCustomer(prev => prev ? { ...prev, salutation, first_name: firstName, last_name: lastName, company, position: position || null, email: email || null, phone: phone || null, address: address || null, logo_url: logoUrl || null, assigned_member_id: assignedMemberId && assignedMemberId !== 'none' ? assignedMemberId : null } : null);
    }
  };

  // Auto-save notes
  const debouncedSaveNotes = useDebouncedCallback(async () => {
    await supabase.from('customers').update({ notes: notes || null, updated_at: new Date().toISOString() }).eq('id', params.id);
  }, 1500);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    debouncedSaveNotes();
  };

  const handleDelete = async () => {
    await supabase.from('customers').delete().eq('id', params.id);
    toast({ title: 'Kunde gelöscht' });
    router.push('/dashboard/customers');
  };

  // Stats
  const totalViews = 0; // Could be aggregated from tracking_events
  const signedCount = dealrooms.filter(d => d.status === 'signed').length;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center py-20">
        <p className="text-[#6b7280]">Kunde nicht gefunden.</p>
        <Link href="/dashboard/customers">
          <Button variant="outline" className="mt-4">Zurück zur Übersicht</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Back */}
      <Link href="/dashboard/customers" className="inline-flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a1a] mb-6">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      {/* Customer Info Card */}
      <Card className="mb-6">
        <CardContent className="py-5 px-6">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-[100px_1fr_1fr] gap-3">
                <div className="space-y-1.5">
                  <Label>Anrede</Label>
                  <Select value={salutation} onValueChange={(v) => setSalutation(v as 'Herr' | 'Frau')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Herr">Herr</SelectItem>
                      <SelectItem value="Frau">Frau</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vorname</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nachname</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Firma</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Position</Label>
                  <Select value={position || 'Geschäftsführer'} onValueChange={setPosition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Geschäftsführer">Geschäftsführer</SelectItem>
                      <SelectItem value="Angestellter">Angestellter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>E-Mail</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Kundenlogo
                </Label>
                <div className="flex items-center gap-3">
                  {logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-10 object-contain rounded" />
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {logoUrl ? 'Ändern' : 'Logo hochladen'}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadFile(file, 'logos');
                        if (url) setLogoUrl(url);
                      }}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setLogoUrl('')} className="text-xs text-red-500">
                      Entfernen
                    </Button>
                  )}
                </div>
              </div>

              {teamMembers.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Zuständiger Ansprechpartner
                  </Label>
                  <Select value={assignedMemberId || 'none'} onValueChange={setAssignedMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ansprechpartner wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Ansprechpartner</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}{m.position ? ` – ${m.position}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Speichern
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Abbrechen</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {customer.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customer.logo_url} alt={customer.company} className="h-14 w-14 rounded-lg object-contain" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-[#FEF3E2] flex items-center justify-center text-[#E97E1C] text-xl font-bold">
                    {customer.company.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-[#1a1a1a]">{customer.company}</h2>
                  <p className="text-sm text-[#6b7280]">
                    {customer.salutation} {customer.first_name} {customer.last_name}
                    {customer.position && ` · ${customer.position}`}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#6b7280]">
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-[#E97E1C]">
                        <Phone className="h-3.5 w-3.5" /> {customer.phone}
                      </a>
                    )}
                    {customer.email && (
                      <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-[#E97E1C]">
                        <Mail className="h-3.5 w-3.5" /> {customer.email}
                      </a>
                    )}
                    {customer.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {customer.address}
                      </span>
                    )}
                    {customer.assigned_member_id && (() => {
                      const member = teamMembers.find(m => m.id === customer.assigned_member_id);
                      return member ? (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {member.name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Bearbeiten</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteConfirmOpen(true)}>Löschen</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: dealrooms.length, label: 'Dealrooms' },
          { value: signedCount, label: 'Signiert' },
          { value: totalViews, label: 'Views' },
          { value: dealrooms.length > 0 ? `${Math.round((signedCount / dealrooms.length) * 100)}%` : '–', label: 'Abschlussrate' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-[#E97E1C]">{stat.value}</p>
              <p className="text-xs text-[#6b7280]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dealrooms */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Dealrooms</CardTitle>
            <Link href={`/dashboard/new?customer_id=${customer.id}`}>
              <Button size="sm" variant="outline">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Neuer Dealroom
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {dealrooms.length === 0 ? (
            <p className="text-sm text-[#9ca3af] text-center py-6">Noch keine Dealrooms für diesen Kunden.</p>
          ) : (
            <div className="space-y-2">
              {dealrooms.map((d) => (
                <Link key={d.id} href={`/dashboard/dealrooms/${d.id}`}>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#fafafa] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#1a1a1a]">{d.generated_content?.hero_title || d.client_company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${statusLabels[d.status]?.color || ''}`}>
                        {statusLabels[d.status]?.label || d.status}
                      </Badge>
                      <Eye className="h-3.5 w-3.5 text-[#d1d5db]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Interne Notizen zu diesem Kunden..."
            rows={4}
          />
          <p className="text-[10px] text-[#9ca3af] mt-1">Notizen werden automatisch gespeichert</p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Kunde löschen?"
        description={`Der Kunde "${customer.company}" wird unwiderruflich gelöscht. Verknüpfte Dealrooms bleiben erhalten.`}
        confirmText="Löschen"
        variant="destructive"
      />
    </div>
  );
}
