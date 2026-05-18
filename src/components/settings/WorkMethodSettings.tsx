import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Briefcase } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface WorkMethod {
  id: string;
  driver_id: string;
  aide_livreur: string;
  sector_id: string;
  product_ids: string[];
}

export const WorkMethodSettings = () => {
  const { drivers, bottleTypes } = useApp();
  const { toast } = useToast();
  
  const [sectors, setSectors] = useState<Array<{ id: string; code: string; secteurs: string }>>([]);
  const [methods, setMethods] = useState<WorkMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [aideLivreur, setAideLivreur] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Load Sectors and Work Methods
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Load sectors
      const { data: sectorsData } = await supabase.from('sectors_settings').select('id, code, secteurs');
      if (sectorsData) setSectors(sectorsData);

      // Load work methods (create table if it doesn't exist)
      const { data: methodsData, error } = await supabase.from('work_methods').select('*');
      if (error) {
        // Fallback to local storage if table doesn't exist yet
        const localData = localStorage.getItem('work_methods_v1');
        if (localData) {
          try {
            setMethods(JSON.parse(localData));
          } catch (e) {}
        }
      } else if (methodsData) {
        setMethods(methodsData.map(item => ({
          ...item,
          product_ids: typeof item.product_ids === 'string' ? JSON.parse(item.product_ids) : (item.product_ids || [])
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Pre-fill Aide Livreur when Driver changes
  useEffect(() => {
    if (selectedDriverId) {
      const driver = drivers.find(d => d.id === selectedDriverId);
      if (driver && driver.aideLivreurs) {
        setAideLivreur(driver.aideLivreurs);
      } else {
        setAideLivreur('');
      }
    }
  }, [selectedDriverId, drivers]);

  const handleSave = async () => {
    if (!selectedDriverId || !aideLivreur || !selectedSectorId || selectedProducts.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs (Chauffeur, Aide livreur, Secteur, et au moins un Produit).',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    const newMethod = {
      id: crypto.randomUUID(),
      driver_id: selectedDriverId,
      aide_livreur: aideLivreur,
      sector_id: selectedSectorId,
      product_ids: selectedProducts
    };

    const { error } = await supabase.from('work_methods').insert({
      id: newMethod.id,
      driver_id: newMethod.driver_id,
      aide_livreur: newMethod.aide_livreur,
      sector_id: newMethod.sector_id,
      product_ids: JSON.stringify(newMethod.product_ids)
    });

    if (error) {
      // Fallback if table doesn't exist
      const nextMethods = [...methods, newMethod];
      setMethods(nextMethods);
      localStorage.setItem('work_methods_v1', JSON.stringify(nextMethods));
    } else {
      setMethods([...methods, newMethod]);
    }

    toast({ title: 'Succès', description: 'Méthode de travail enregistrée avec succès.' });
    
    // Reset form
    setSelectedDriverId('');
    setAideLivreur('');
    setSelectedSectorId('');
    setSelectedProducts([]);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette méthode ?')) return;
    
    const { error } = await supabase.from('work_methods').delete().eq('id', id);
    if (error) {
      const nextMethods = methods.filter(m => m.id !== id);
      setMethods(nextMethods);
      localStorage.setItem('work_methods_v1', JSON.stringify(nextMethods));
    } else {
      setMethods(methods.filter(m => m.id !== id));
    }
    toast({ title: 'Supprimé', description: 'La méthode a été supprimée.' });
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader className="border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-slate-100">Méthode de travail</CardTitle>
            <CardDescription className="text-slate-300">
              Configurez la méthode de travail (Chauffeur, Aide livreur, Secteur, Produits).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
          <div className="space-y-2">
            <Label className="text-slate-200">Chauffeur</Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                <SelectValue placeholder="Choisir un chauffeur" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDriverId && (
            <div className="space-y-2">
              <Label className="text-slate-200">Aide livreur</Label>
              <Select value={aideLivreur} onValueChange={setAideLivreur}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Choisir depuis la liste existante" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {drivers
                    .filter(d => d.aideLivreurs)
                    .map(d => d.aideLivreurs)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((aide, idx) => (
                      <SelectItem key={idx} value={aide as string}>{aide}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedDriverId && aideLivreur && (
            <div className="space-y-2">
              <Label className="text-slate-200">Secteur</Label>
              <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Choisir un secteur" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {sectors.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.code} - {s.secteurs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedDriverId && aideLivreur && selectedSectorId && (
            <div className="space-y-2">
              <Label className="text-slate-200">Produits (Inventaire)</Label>
              <div className="max-h-32 overflow-y-auto p-2 border border-slate-700 bg-slate-900 rounded-md space-y-2">
                {bottleTypes.map(bottle => (
                  <label key={bottle.id} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                    <Checkbox
                      checked={selectedProducts.includes(bottle.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts([...selectedProducts, bottle.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== bottle.id));
                        }
                      }}
                    />
                    {bottle.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter la méthode
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-800/60">
              <TableRow>
                <TableHead className="text-slate-200">Chauffeur</TableHead>
                <TableHead className="text-slate-200">Aide livreur</TableHead>
                <TableHead className="text-slate-200">Secteur</TableHead>
                <TableHead className="text-slate-200">Produits</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-6">Chargement...</TableCell>
                </TableRow>
              ) : methods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-6">Aucune méthode de travail configurée.</TableCell>
                </TableRow>
              ) : (
                methods.map(method => {
                  const driverName = drivers.find(d => d.id === method.driver_id)?.name || 'Inconnu';
                  const sectorName = sectors.find(s => s.id === method.sector_id)?.secteurs || 'Inconnu';
                  const products = method.product_ids.map(id => bottleTypes.find(b => b.id === id)?.name).filter(Boolean);

                  return (
                    <TableRow key={method.id} className="hover:bg-slate-800/40">
                      <TableCell className="font-medium text-slate-100">{driverName}</TableCell>
                      <TableCell className="text-slate-300">{method.aide_livreur}</TableCell>
                      <TableCell className="text-slate-300">{sectorName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {products.map((p, i) => (
                            <Badge key={i} variant="outline" className="bg-slate-800 text-slate-200 border-slate-600">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(method.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
