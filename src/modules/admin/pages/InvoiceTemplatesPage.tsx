import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, Tooltip, Divider, InputAdornment,
  ToggleButton, ToggleButtonGroup, Paper, Avatar, Menu,
  Snackbar, Alert, Tabs, Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DocIcon,
  Receipt as InvoiceIcon,
  Assignment as InspectionIcon,
  Article as ArticleIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as DuplicateIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  BarChart as ChartIcon,
  QrCode as QrIcon,
  FileCopy as FileCopyIcon,
} from '@mui/icons-material';

import { useInvoiceTemplates } from '../hooks/useInvoiceTemplates';
import { invoiceTemplateService } from '../services/invoiceTemplateService';
import type { InvoiceTemplate } from '../domain/invoiceTemplate.types';

type TemplateType = 'INVOICE' | 'RECEIPT' | 'INSPECTION' | 'CERTIFICATE' | 'REPORT';
type TemplateStatus = 'active' | 'inactive' | 'draft';

const TYPE_META: Record<TemplateType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  INVOICE: { label: 'Factura', icon: <InvoiceIcon />, color: '#1e40af', bg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' },
  RECEIPT: { label: 'Recibo', icon: <DocIcon />, color: '#065f46', bg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' },
  INSPECTION: { label: 'Inspección', icon: <InspectionIcon />, color: '#7c3aed', bg: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
  CERTIFICATE: { label: 'Certificado', icon: <ArticleIcon />, color: '#b45309', bg: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' },
  REPORT: { label: 'Reporte', icon: <ChartIcon />, color: '#be123c', bg: 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)' },
};

const STATUS_MAP: Record<TemplateStatus, { label: string; color: 'success' | 'default' | 'warning'; icon: React.ReactNode }> = {
  active: { label: 'Activa', color: 'success', icon: <ActiveIcon sx={{ fontSize: 14 }} /> },
  inactive: { label: 'Inactiva', color: 'default', icon: <InactiveIcon sx={{ fontSize: 14 }} /> },
  draft: { label: 'Borrador', color: 'warning', icon: <EditIcon sx={{ fontSize: 14 }} /> },
};

export function InvoiceTemplatesPage() {
  const navigate = useNavigate();
  const {
    templates, loading, handleActivate, handleDelete, setDeleteTarget, deleteTarget, fetchData, showToast, toast
  } = useInvoiceTemplates();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TemplateType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<TemplateStatus | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState(0);

  const [newDialog, setNewDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<InvoiceTemplate | null>(null);

  const [newForm, setNewForm] = useState({ name: '', type: 'INVOICE' as TemplateType, description: '' });

  const renderTemplate = (html: string) => {
    let rendered = html;
    
    // Inject print-optimized CSS
    const printStyles = `
      <style>
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ensure everything tries to stay on one page */
          html, body {
            height: 99%;
            overflow: hidden;
          }
          /* Prevent breaking inside cards or tables */
          .header, .totals, .footer, table, tr, div {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Scale down slightly if content is too large */
          body {
            zoom: 0.95;
          }
        }
      </style>
    `;

    // Insert styles before </head> or at the beginning
    if (rendered.includes('</head>')) {
      rendered = rendered.replace('</head>', `${printStyles}</head>`);
    } else {
      rendered = printStyles + rendered;
    }

    const mockData: Record<string, any> = {
      'invoice.number': 'FAC-0001',
      'invoice.id': 'INV-12345',
      'invoice.subtotal': '250.000',
      'invoice.tax': '47.500',
      'invoice.total': '297.500',
      'invoice.item_description': 'Revisión Técnico Mecánica',
      'invoice.item_quantity': '1',
      'invoice.item_unitPrice': '250.000',
      'invoice.item_total': '250.000',
      'client.name': 'Juan Pérez',
      'client.document': '1.085.123.456',
      'date.day': new Date().getDate().toString().padStart(2, '0'),
      'date.month': (new Date().getMonth() + 1).toString().padStart(2, '0'),
      'date.year': new Date().getFullYear().toString(),
    };

    Object.entries(mockData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    // Handle simple each loops if present (naive approach)
    rendered = rendered.replace(/{{#each invoice\.items}}([\s\S]*?){{\/each}}/g, '$1');

    return rendered;
  };

  const handleExportPdf = () => {
    if (iframeRef.current) {
      const contentWindow = iframeRef.current.contentWindow;
      if (contentWindow) {
        contentWindow.focus();
        contentWindow.print();
      }
    }
  };

  const handleMenuExport = () => {
    if (menuTarget) {
      setEditingTemplate(menuTarget);
      // We need to wait for the dialog to open and iframe to load to print.
      // A better way is to open the preview and then trigger print, or just open preview.
      // For now, let's just open the preview as it's the safest way to ensure iframe exists.
      setPreviewDialog(true);
      closeMenu();
    }
  };

  // Map domain templates to UI format for filtering/display
  const mappedTemplates = templates.map(t => ({
    ...t,
    uiType: (t.typeCode as TemplateType) || 'INVOICE',
    uiStatus: t.isActive ? 'active' : 'inactive' as TemplateStatus,
    // Add missing fields for UI consistency
    description: (t as any).description || 'Diseño de plantilla oficial para la generación de documentos legales y comerciales del CDA.',
    usageCount: t.usageCount ?? 0,
    starred: (t as any).starred ?? false,
    previewColor: TYPE_META[(t.typeCode as TemplateType) || 'INVOICE']?.color || '#1e40af',
    versionLabel: 'v1.0',
    lastModifiedLabel: t.updatedAt ? new Date(t.updatedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  }));

  const filtered = mappedTemplates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || t.uiType === filterType;
    const matchStatus = filterStatus === 'ALL' || t.uiStatus === filterStatus;
    const matchTab = activeTab === 0 ? true : activeTab === 1 ? t.starred : t.uiStatus === 'draft';
    return matchSearch && matchType && matchStatus && matchTab;
  });

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    totalUsage: mappedTemplates.reduce((acc, t) => acc + t.usageCount, 0),
    starred: mappedTemplates.filter(t => t.starred).length,
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, t: InvoiceTemplate) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuTarget(t);
  };
  const closeMenu = () => { setMenuAnchor(null); setMenuTarget(null); };

  const handleCreate = async () => {
    if (!newForm.name.trim()) return;
    try {
      const created = await invoiceTemplateService.crear({
        name: newForm.name.trim(),
        typeCode: newForm.type,
        body: '<div>Nueva Plantilla</div>'
      });
      setNewDialog(false);
      setNewForm({ name: '', type: 'INVOICE', description: '' });
      showToast(`Plantilla "${created.name}" creada`, 'success');
      fetchData();
      navigate(`/admin/documentos/${created.id}/edit`);
    } catch {
      showToast('Error al crear la plantilla', 'error');
    }
  };

  const onConfirmDelete = async () => {
    if (!menuTarget) return;
    setDeleteTarget(menuTarget);
    closeMenu();
  };

  const handleDuplicate = async (t: InvoiceTemplate) => {
    try {
      await invoiceTemplateService.crear({
        name: `${t.name} (Copia)`,
        typeCode: t.typeCode,
        body: t.body
      });
      showToast(`"${t.name}" duplicada`, 'success');
      fetchData();
      closeMenu();
    } catch {
      showToast('Error al duplicar', 'error');
    }
  };

  const toggleStatus = async (t: InvoiceTemplate) => {
    try {
      if (!t.isActive) {
        await handleActivate(t.id);
      } else {
        // Current service doesn't have deactivate, but we could toggle or just inform
        showToast('La plantilla ya está activa', 'success');
      }
      closeMenu();
    } catch {
      showToast('Error al cambiar estado', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Stats row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Total Plantillas', value: stats.total, icon: <FileCopyIcon />, color: '#1e40af', bg: 'linear-gradient(135deg,#dbeafe,#eff6ff)' },
          { label: 'Plantillas Activas', value: stats.active, icon: <ActiveIcon />, color: '#065f46', bg: 'linear-gradient(135deg,#d1fae5,#f0fdf4)' },
          { label: 'Tipos Disponibles', value: Object.keys(TYPE_META).length, icon: <SettingsIcon />, color: '#7c3aed', bg: 'linear-gradient(135deg,#ede9fe,#faf5ff)' },
        ].map((s, i) => (
          <Box key={i}>
            <Paper
              sx={{
                p: 2.5, borderRadius: 3, background: s.bg,
                border: '1px solid', borderColor: `${s.color}22`,
                display: 'flex', alignItems: 'center', gap: 2,
              }}
            >
              <Avatar sx={{ bgcolor: s.color, width: 44, height: 44 }}>
                {s.icon}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Configuración de Documentos</Typography>
          <Typography variant="body2" color="text.secondary">
            Personaliza el diseño de tus facturas y comprobantes con el editor Canvas.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewDialog(true)}
          sx={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            borderRadius: 2, px: 3, fontWeight: 700,
            boxShadow: '0 4px 14px rgba(30,64,175,0.35)',
            '&:hover': { background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', boxShadow: '0 6px 20px rgba(30,64,175,0.45)' },
          }}
        >
          Nueva Plantilla
        </Button>
      </Box>

      {/* Tabs + Filters */}
      <Paper sx={{ borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f1f5f9' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)} 
            sx={{ 
              minHeight: 36,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 36,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.875rem',
                px: 3,
                color: '#64748b',
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  color: '#ffffff',
                  bgcolor: '#1e40af',
                  boxShadow: '0 4px 12px rgba(30,64,175,0.3)',
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: '#e2e8f0',
                  color: '#1e293b',
                }
              }
            }}
          >
            <Tab label="Todas las Plantillas" />
          </Tabs>
        </Box>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar plantillas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>
              }
            }}
            sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={filterType} label="Tipo" onChange={e => setFilterType(e.target.value as TemplateType | 'ALL')} sx={{ borderRadius: 2 }}>
              <MenuItem value="ALL">Todos los tipos</MenuItem>
              {(Object.keys(TYPE_META) as TemplateType[]).map(k => (
                <MenuItem key={k} value={k}>{TYPE_META[k].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={filterStatus} label="Estado" onChange={e => setFilterStatus(e.target.value as TemplateStatus | 'ALL')} sx={{ borderRadius: 2 }}>
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="active">Activas</MenuItem>
              <MenuItem value="inactive">Inactivas</MenuItem>
              <MenuItem value="draft">Borradores</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ ml: 'auto' }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
              <ToggleButton value="grid"><GridViewIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="list"><ListViewIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filtered.length} plantilla{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <Box className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </Box>
      ) : viewMode === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {filtered.map(t => {
            const meta = TYPE_META[t.uiType] || TYPE_META['INVOICE'];
            const statusInfo = STATUS_MAP[t.uiStatus];
            return (
              <Box key={t.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: t.isActive ? `${meta.color}44` : 'divider',
                    transition: 'all 0.25s',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 16px 40px ${meta.color}22`,
                      borderColor: meta.color,
                    },
                  }}
                >
                  {/* Top gradient banner */}
                  <Box sx={{ height: 6, background: meta.bg, borderRadius: '12px 12px 0 0' }} />

                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 44, height: 44,
                            background: meta.bg,
                            boxShadow: `0 4px 12px ${meta.color}44`,
                          }}
                        >
                          {meta.icon}
                        </Avatar>
                        <Box>
                          <Chip
                            label={meta.label}
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.7rem', fontWeight: 700,
                              bgcolor: `${meta.color}15`, color: meta.color,
                              border: `1px solid ${meta.color}30`,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {t.versionLabel}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                          icon={statusInfo.icon as React.ReactElement}
                          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                        />
                        <IconButton size="small" onClick={(e) => openMenu(e, t)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Template preview mini */}
                    <Box
                      sx={{
                        height: 90, borderRadius: 2, mb: 2,
                        background: `linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)`,
                        border: '1px solid', borderColor: 'divider',
                        display: 'flex', flexDirection: 'column',
                        p: 1.5, gap: 0.75, overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {/* Mini doc lines */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ width: 18, height: 18, borderRadius: 0.5, bgcolor: meta.color, opacity: 0.9 }} />
                        <Box sx={{ height: 6, width: '40%', borderRadius: 1, bgcolor: meta.color, opacity: 0.7 }} />
                        <Box sx={{ height: 5, width: '25%', borderRadius: 1, bgcolor: 'grey.300', ml: 'auto' }} />
                      </Box>
                      <Box sx={{ height: 4, width: '80%', borderRadius: 1, bgcolor: 'grey.200' }} />
                      <Box sx={{ height: 4, width: '60%', borderRadius: 1, bgcolor: 'grey.200' }} />
                      <Box sx={{ height: 4, width: '70%', borderRadius: 1, bgcolor: 'grey.200' }} />
                      <Box
                        sx={{
                          position: 'absolute', bottom: 8, right: 10,
                          width: 20, height: 20, borderRadius: 0.5,
                          border: `1.5px solid ${meta.color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0.6,
                        }}
                      >
                        <QrIcon sx={{ fontSize: 12, color: meta.color }} />
                      </Box>
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, lineHeight: 1.5 }}>
                      {t.description}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
                        <Typography variant="caption" color="text.secondary">Documento</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.versionLabel}</Typography>
                        <Typography variant="caption" color="text.secondary">Versión</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.lastModifiedLabel}</Typography>
                        <Typography variant="caption" color="text.secondary">Modificado</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        fullWidth
                        onClick={() => navigate(`/admin/documentos/${t.id}/edit`)}
                        sx={{
                          background: meta.bg, borderRadius: 2, textTransform: 'none', fontWeight: 600,
                          boxShadow: `0 4px 12px ${meta.color}33`,
                          '&:hover': { opacity: 0.9 },
                        }}
                      >
                        Editar
                      </Button>
                      <Tooltip title="Vista previa">
                        <IconButton
                          onClick={() => { setEditingTemplate(t); setPreviewDialog(true); }}
                          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}

          {/* New template card */}
          <Box>
            <Card
              onClick={() => setNewDialog(true)}
              sx={{
                borderRadius: 3, border: '2px dashed', borderColor: 'divider',
                bgcolor: 'transparent', cursor: 'pointer', height: '100%', minHeight: 320,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 2,
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', bgcolor: '#eff6ff' },
              }}
            >
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#dbeafe', color: '#1e40af' }}>
                <AddIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>Nueva Plantilla</Typography>
                <Typography variant="caption" color="text.secondary">Crea desde cero o usa una plantilla base</Typography>
              </Box>
            </Card>
          </Box>
        </Box>
      ) : (
        /* LIST VIEW */
        <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {/* List header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            {['Plantilla', 'Tipo', 'Estado', 'Formato', 'Modificado', 'Acciones'].map(h => (
              <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {h}
              </Typography>
            ))}
          </Box>
          {filtered.map((t, idx) => {
            const meta = TYPE_META[t.uiType] || TYPE_META['INVOICE'];
            const statusInfo = STATUS_MAP[t.uiStatus];
            return (
              <Box key={t.id}>
                <Box
                  sx={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                    px: 2, py: 1.5, alignItems: 'center',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 36, height: 36, background: meta.bg, flexShrink: 0 }}>
                      {meta.icon}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label={meta.label} size="small" sx={{ width: 'fit-content', bgcolor: `${meta.color}15`, color: meta.color, fontWeight: 700, border: `1px solid ${meta.color}30` }} />
                  <Chip label={statusInfo.label} color={statusInfo.color} size="small" icon={statusInfo.icon as React.ReactElement} sx={{ width: 'fit-content', fontWeight: 700 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: meta.color }}>{meta.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.lastModifiedLabel}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => navigate(`/admin/documentos/${t.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Vista previa"><IconButton size="small" onClick={() => { setEditingTemplate(t); setPreviewDialog(true); }}><PreviewIcon fontSize="small" /></IconButton></Tooltip>
                    <IconButton size="small" onClick={(e) => openMenu(e, t)}><MoreVertIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                {idx < filtered.length - 1 && <Divider />}
              </Box>
            );
          })}
          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <DocIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">No se encontraron plantillas</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* CONTEXT MENU */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}>
        <MenuItem onClick={() => { if (menuTarget) navigate(`/admin/documentos/${menuTarget.id}/edit`); closeMenu(); }} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" color="primary" /><Typography variant="body2">Editar plantilla</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (menuTarget) { setEditingTemplate(menuTarget); setPreviewDialog(true); } closeMenu(); }} sx={{ gap: 1.5 }}>
          <PreviewIcon fontSize="small" color="action" /><Typography variant="body2">Vista previa</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (menuTarget) handleDuplicate(menuTarget); }} sx={{ gap: 1.5 }}>
          <DuplicateIcon fontSize="small" color="action" /><Typography variant="body2">Duplicar</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (menuTarget) toggleStatus(menuTarget); }} sx={{ gap: 1.5 }}>
          <SettingsIcon fontSize="small" color="action" /><Typography variant="body2">Cambiar estado</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuExport} sx={{ gap: 1.5 }}>
          <DownloadIcon fontSize="small" color="action" /><Typography variant="body2">Exportar PDF</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={onConfirmDelete} sx={{ gap: 1.5, color: 'error.main' }}>
          <DeleteIcon fontSize="small" /><Typography variant="body2">Eliminar</Typography>
        </MenuItem>
      </Menu>

      {/* NEW TEMPLATE DIALOG */}
      <Dialog open={newDialog} onClose={() => setNewDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <Avatar sx={{ bgcolor: '#dbeafe', color: '#1e40af' }}><AddIcon /></Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Nueva Plantilla</Typography>
            <Typography variant="caption" color="text.secondary">Define el tipo y nombre de la plantilla</Typography>
          </Box>
          <IconButton sx={{ ml: 'auto' }} onClick={() => setNewDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Nombre de la plantilla"
              fullWidth
              value={newForm.name}
              onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Factura Premium CDA"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de documento</InputLabel>
              <Select
                value={newForm.type}
                label="Tipo de documento"
                onChange={e => setNewForm(f => ({ ...f, type: e.target.value as TemplateType }))}
                sx={{ borderRadius: 2 }}
              >
                {(Object.keys(TYPE_META) as TemplateType[]).map(k => (
                  <MenuItem key={k} value={k}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28, background: TYPE_META[k].bg }}>
                        {TYPE_META[k].icon}
                      </Avatar>
                      {TYPE_META[k].label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setNewDialog(false)} sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newForm.name.trim()}
            sx={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            Crear y abrir editor
          </Button>
        </DialogActions>
      </Dialog>

      {/* PREVIEW DIALOG */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, height: '85vh' } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <PreviewIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vista previa — {editingTemplate?.name}</Typography>
            <Typography variant="caption" color="text.secondary">Renderizado con datos de prueba</Typography>
          </Box>
          <IconButton sx={{ ml: 'auto' }} onClick={() => setPreviewDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#e2e8f0', p: 0, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          {editingTemplate && (
            <Box sx={{ width: '100%', height: '100%', p: 3, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <Paper 
                elevation={8} 
                sx={{ 
                  width: '794px', // A4 Width
                  minHeight: '1123px', // A4 Height proportional
                  bgcolor: 'white',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  p: 0,
                  overflow: 'hidden'
                }}
              >
                <iframe
                  ref={iframeRef}
                  title="Preview"
                  srcDoc={renderTemplate(editingTemplate.body)}
                  style={{
                    width: '100%',
                    height: '1123px',
                    border: 'none',
                    display: 'block'
                  }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', gap: 1 }}>
          <Button 
            startIcon={<DownloadIcon />} 
            variant="contained" 
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
              bgcolor: '#1e40af',
              '&:hover': { bgcolor: '#1e3a8a' }
            }}
            onClick={handleExportPdf}
          >
            Exportar PDF
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="contained"
            startIcon={<EditIcon />} 
            onClick={() => { setPreviewDialog(false); navigate(`/admin/documentos/${editingTemplate?.id}/edit`); }} 
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 700,
              bgcolor: '#64748b',
              '&:hover': { bgcolor: '#475569' }
            }}
          >
            Abrir en Editor
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setPreviewDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary', borderColor: 'divider' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar la plantilla <strong>"{deleteTarget?.name}"</strong>? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: 2 }}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => {}} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast ? <Alert severity={toast.type} sx={{ borderRadius: 2 }}>{toast.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
