'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Customer, TeamMember } from '@/types/database';
import { Plus, Search, Building2, ArrowRight, Upload, ImageIcon, Users } from 'lucide-react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Textarea } from '@/components/ui/textarea';
import { uploadFile } from '@/lib/upload';

export default function CustomersPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Stats per customer
  const [dealroomCounts, setDealroomCounts] = useState<Record<string, { total: number; signed: number }>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Form
  const [salutation, setSalutation] = useState<'Herr' | 'Frau'>('Herr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data }, { data: dealrooms }, { data: members }] = await Promise.all([
      supabase.from('customers').select('*').eq('admin_id', user.id).order('company'),
      supabase.from('dealrooms').select('customer_id, status').eq('admin_id', user.id).not('customer_id', 'is', null),
      supabase.from('team_members').select('*').eq('admin_id', user.id).eq('is_active', true).order('name'),
    ]);

    setCustomers((data as Customer[]) || []);
    setTeamMembers((members as TeamMember[]) || []);

    const counts: Record<string, { total: number; signed: number }> = {};
    dealrooms?.forEach((d: { customer_id: string; status: string }) => {
      if (!counts[d.customer_id]) counts[d.customer_id] = { total: 0, signed: 0 };
      counts[d.customer_id].total++;
      if (d.status === 'signed') counts[d.customer_id].signed++;
    });
    setDealroomCounts(counts);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const resetForm = () => {
    setSalutation('Herr');
    setFirstName('');
    setLastName('');
    setCompany('');
    setPosition('');
    setEmail('');
    setPhone('');
    setAddress('');
    setLogoUrl('');
    setAssignedMemberId('');
    setFormNotes('');
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('customers').insert({
      admin_id: user.id,
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
      notes: formNotes || null,
    });

    if (error) {
      toast({ title: 'Fehler', description: 'Kunde konnte nicht erstellt werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Kunde erstellt' });
      resetForm();
      setDialogOpen(false);
      fetchCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
    toast({ title: 'Kunde gelöscht' });
    fetchCustomers();
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.company.toLowerCase().includes(q) || c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Kunden</h1>
          <p className="text-sm text-[#6b7280] mt-1">Verwalte deine Kundendatenbank</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kunde
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kunde suchen..."
          className="pl-10"
        />
      </div>

      {/* Customer list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <Building2 className="h-10 w-10 text-[#d1d5db] mx-auto mb-3" />
            <p className="text-[#6b7280] font-medium">Noch keine Kunden</p>
            <p className="text-sm text-[#9ca3af] mt-1">Erstelle deinen ersten Kunden um loszulegen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => {
            const counts = dealroomCounts[customer.id] || { total: 0, signed: 0 };
            return (
              <Link key={customer.id} href={`/dashboard/customers/${customer.id}`}>
                <Card className="hover:border-[#11485e]/30 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="py-4 px-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {customer.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={customer.logo_url} alt={customer.company} className="h-10 w-10 rounded-lg object-contain" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-[#e7eef1] flex items-center justify-center text-[#11485e] text-sm font-bold">
                          {customer.company.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#1a1a1a] text-sm">{customer.company}</p>
                        <p className="text-xs text-[#6b7280]">
                          {customer.salutation} {customer.first_name} {customer.last_name}
                          {customer.position && ` · ${customer.position}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs text-[#6b7280]">
                        <p>{counts.total} Dealroom{counts.total !== 1 ? 's' : ''}</p>
                        {counts.signed > 0 && <p className="text-emerald-600">{counts.signed} Signiert</p>}
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#d1d5db]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Neuer Kunde</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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
                <Label>Vorname *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Max" />
              </div>
              <div className="space-y-1.5">
                <Label>Nachname *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Mustermann" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Firma *</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Musterfirma GmbH" />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Geschäftsführer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>E-Mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="max@firma.de" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02261/..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straße, PLZ Ort" />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Kundenlogo (optional)
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
                <Select value={assignedMemberId} onValueChange={setAssignedMemberId}>
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

            <div className="space-y-1.5">
              <Label>Notizen (optional)</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Interne Notizen zu diesem Kunden..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={!firstName || !lastName || !company}>
                Erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}
        title="Kunde löschen?"
        description="Der Kunde wird unwiderruflich gelöscht. Verknüpfte Dealrooms bleiben erhalten."
        confirmText="Löschen"
        variant="destructive"
      />
    </div>
  );
}
