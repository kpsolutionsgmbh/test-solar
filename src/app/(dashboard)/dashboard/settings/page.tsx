'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AdminUser, TeamMember } from '@/types/database';
import { Save, Loader2, Upload, Plus, Pencil, Trash2, Users, User2 } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import { ImageCropper } from '@/components/ui/image-cropper';

export default function SettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [brandColor, setBrandColor] = useState('#11485e');
  const [logoUrl, setLogoUrl] = useState('');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberPosition, setMemberPosition] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberAvatarUrl, setMemberAvatarUrl] = useState('');

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState('');

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: adminData }, { data: membersData }] = await Promise.all([
      supabase.from('admin_users').select('*').eq('id', user.id).single(),
      supabase.from('team_members').select('*').eq('admin_id', user.id).order('name'),
    ]);

    if (adminData) {
      const admin = adminData as AdminUser;
      setName(admin.name);
      setCompanyName(admin.company_name);
      setBrandColor(admin.brand_color);
      setLogoUrl(admin.company_logo_url || '');
    }
    setTeamMembers((membersData as TeamMember[]) || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('admin_users')
      .update({
        name,
        company_name: companyName,
        brand_color: brandColor,
        company_logo_url: logoUrl || null,
      })
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    } else {
      toast({ title: 'Gespeichert', description: 'Einstellungen wurden aktualisiert.' });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Fehler', description: 'Passwörter stimmen nicht überein.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Fehler', description: 'Passwort muss mindestens 8 Zeichen lang sein.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Fehler', description: 'Passwort konnte nicht geändert werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Passwort geändert' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, 'logos');
    if (!url) {
      toast({ title: 'Fehler', description: 'Logo-Upload fehlgeschlagen.', variant: 'destructive' });
      return;
    }

    setLogoUrl(url);
    toast({ title: 'Logo hochgeladen' });
  };

  // Team member CRUD
  const resetMemberForm = () => {
    setMemberName('');
    setMemberPosition('');
    setMemberEmail('');
    setMemberPhone('');
    setMemberAvatarUrl('');
    setEditingMember(null);
  };

  const openEditMember = (m: TeamMember) => {
    setEditingMember(m);
    setMemberName(m.name);
    setMemberPosition(m.position || '');
    setMemberEmail(m.email);
    setMemberPhone(m.phone || '');
    setMemberAvatarUrl(m.avatar_url || '');
    setMemberDialogOpen(true);
  };

  const handleSaveMember = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingMember) {
      await supabase.from('team_members').update({
        name: memberName,
        position: memberPosition || null,
        email: memberEmail,
        phone: memberPhone || null,
        avatar_url: memberAvatarUrl || null,
      }).eq('id', editingMember.id);
      toast({ title: 'Teammitglied aktualisiert' });
    } else {
      await supabase.from('team_members').insert({
        admin_id: user.id,
        name: memberName,
        position: memberPosition || null,
        email: memberEmail,
        phone: memberPhone || null,
        avatar_url: memberAvatarUrl || null,
      });
      toast({ title: 'Teammitglied erstellt' });
    }
    resetMemberForm();
    setMemberDialogOpen(false);
    fetchData();
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Teammitglied löschen?')) return;
    await supabase.from('team_members').delete().eq('id', id);
    toast({ title: 'Teammitglied gelöscht' });
    fetchData();
  };

  const toggleMemberActive = async (m: TeamMember) => {
    await supabase.from('team_members').update({ is_active: !m.is_active }).eq('id', m.id);
    fetchData();
  };

  const handleMemberAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropperImage(objectUrl);
    setCropperOpen(true);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCroppedAvatar = async (blob: Blob) => {
    const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
    const url = await uploadFile(file, 'avatars');
    if (!url) {
      toast({ title: 'Fehler', description: 'Upload fehlgeschlagen.', variant: 'destructive' });
      return;
    }
    setMemberAvatarUrl(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#6b7280]" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Einstellungen</h1>
      <p className="text-sm text-[#6b7280] mb-8">Verwalten Sie Ihr Profil, Branding und Team</p>

      <div className="space-y-6 max-w-3xl">
        {/* Profile & Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User2 className="h-4 w-4 text-[#11485e]" />
              Profil & Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Firmenname</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Primärfarbe</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="max-w-[140px]"
                  placeholder="#11485e"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Firmenlogo</Label>
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                )}
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {logoUrl ? 'Logo ändern' : 'Logo hochladen'}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-[#11485e]" />
                Team / Ansprechpartner
              </CardTitle>
              <Dialog open={memberDialogOpen} onOpenChange={(open) => { setMemberDialogOpen(open); if (!open) resetMemberForm(); }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMember ? 'Teammitglied bearbeiten' : 'Neues Teammitglied'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label>Name *</Label>
                      <Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Max Mustermann" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Position</Label>
                      <Input value={memberPosition} onChange={(e) => setMemberPosition(e.target.value)} placeholder="Berater" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-Mail *</Label>
                      <Input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="max@firma.de" type="email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefon</Label>
                      <Input value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} placeholder="+49 ..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Profilbild</Label>
                      <div className="flex items-center gap-3">
                        {memberAvatarUrl && (
                          <img src={memberAvatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        )}
                        <label className="cursor-pointer">
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="h-3.5 w-3.5 mr-1" />
                              Bild hochladen
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleMemberAvatarSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => { setMemberDialogOpen(false); resetMemberForm(); }}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleSaveMember} disabled={!memberName || !memberEmail}>
                        {editingMember ? 'Aktualisieren' : 'Erstellen'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-[#d1d5db] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">Noch keine Teammitglieder</p>
                <p className="text-xs text-[#9ca3af] mt-1">Fügen Sie Ansprechpartner hinzu, die in Dealrooms angezeigt werden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-opacity ${
                      m.is_active ? 'border-[#e5e7eb]' : 'border-[#e5e7eb] opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-[#11485e]/10 flex items-center justify-center text-[#11485e] text-sm font-semibold shrink-0">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">{m.name}</p>
                        <p className="text-xs text-[#6b7280] truncate">
                          {m.position && `${m.position} - `}{m.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={m.is_active} onCheckedChange={() => toggleMemberActive(m)} />
                      <Button variant="ghost" size="sm" onClick={() => openEditMember(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(m.id)} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Passwort ändern</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Neues Passwort</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Passwort bestätigen</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handlePasswordChange}
              disabled={!newPassword || !confirmPassword}
            >
              Passwort ändern
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Avatar Cropper */}
      <ImageCropper
        imageSrc={cropperImage}
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCroppedAvatar}
      />
    </div>
  );
}
