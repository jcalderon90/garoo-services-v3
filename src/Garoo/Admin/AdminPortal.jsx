import React, { useState, useEffect } from "react";
import { garooInstance } from "../../api/axios";
import { Spinner, Badge, Modal, Button, Tabs, Tab, Table, Form, Row, Col } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2'; // Assuming Swal is available for premium alerts

const AdminPortal = () => {
    const { user: currentUser } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    // Removed unused loading/error state
    const [activeTab, setActiveTab] = useState('organizations');
    
    // Modals & Forms State
    const [showFormModal, setShowFormModal] = useState(false);
    const [modalType, setModalType] = useState('org'); // 'org', 'user', or 'service'
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchData = async () => {
        try {
            const [orgsRes, usersRes, servicesRes] = await Promise.all([
                garooInstance.get("/admin/organizations"),
                garooInstance.get("/admin/users"),
                garooInstance.get("/admin/services")
            ]);
            setOrganizations(orgsRes.data);
            setUsers(usersRes.data);
            setServices(servicesRes.data);
        } catch (e) {
            console.error("Error fetching admin data:", e);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'admin') fetchData();
    }, [currentUser]);

    // Handle Form Opening
    const handleOpenForm = (type, item = null) => {
        setModalType(type);
        setIsEdit(!!item);
        if (item) {
            if (type === 'user') {
                setFormData({ ...item, organizationId: item.organization?._id || item.organization });
            } else {
                setFormData({ ...item });
            }
        } else {
            if (type === 'org') setFormData({ name: '', slug: '', activeServices: [] });
            else if (type === 'user') setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'agent', organization: '', allowedServices: [] });
            else if (type === 'service') setFormData({ name: '', slug: '', path: '', icon: 'bi bi-box-seam', description: '', color: '#2563eb' });
        }
        setShowFormModal(true);
    };

    // Handle Save (Create/Update)
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let endpoint;
            if (modalType === 'org') endpoint = '/admin/organizations';
            else if (modalType === 'user') endpoint = '/admin/users';
            else endpoint = '/admin/services';

            const method = isEdit ? 'put' : 'post';
            const url = isEdit ? `${endpoint}/${formData._id}` : endpoint;

            await garooInstance[method](url, formData);
            
            Swal.fire({ icon: 'success', title: '¡Completado!', text: 'Operación exitosa', timer: 2000, showConfirmButton: false });
            setShowFormModal(false);
            fetchData();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'No se pudo guardar la información' });
        }
    };

    // Handle Delete
    const handleDelete = async (type, id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                let endpoint;
                if (type === 'org') endpoint = `/admin/organizations/${id}`;
                else if (type === 'user') endpoint = `/admin/users/${id}`;
                else endpoint = `/admin/services/${id}`;

                await garooInstance.delete(endpoint);
                Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
                fetchData();
            } catch (ignore) {
                Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
            }
        }
    };

    if (currentUser?.role !== 'admin') {
        return <div className="p-5 text-center"><h3>Acceso Restringido</h3></div>;
    }

    return (
        <div className="page-container animate-in">
            <style>{`
                .admin-header-v2 { background: #fff; padding: 1.5rem 2rem; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
                .data-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
                .tab-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                .btn-premium-sm { font-size: 0.75rem; font-weight: 800; border-radius: 8px; padding: 5px 12px; }
                
                /* Service Selector Styles */
                .service-chip-select {
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 2px solid #f1f5f9;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    border-radius: 12px;
                    user-select: none;
                }
                .service-chip-select:hover {
                    border-color: #cbd5e1;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .service-chip-select.active {
                    border-color: #2563eb;
                    background: #eff6ff;
                }
                .service-icon-box {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    font-size: 1.1rem;
                }
            `}</style>

            <div className="admin-header-v2">
                <div>
                    <h1 className="fw-950 mb-0">Portal de Administración</h1>
                    <p className="text-muted mb-0 small fw-700 tracking-widest mt-1">Multi-Tenant Console</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="light" className="rounded-pill fw-800 border" onClick={fetchData}><i className="bi bi-arrow-clockwise me-2"></i>Sincronizar</Button>
                </div>
            </div>

            <div className="data-card">
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="px-4 border-bottom">
                    <Tab eventKey="organizations" title="Empresas">
                        <div className="tab-header">
                            <span className="fw-800 text-muted small uppercase">Gestión de Clientes</span>
                            <Button variant="primary" className="btn-premium-sm" onClick={() => handleOpenForm('org')}>+ Nueva Empresa</Button>
                        </div>
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr className="small text-muted fw-800">
                                    <th className="px-4">Empresa</th>
                                    <th>Slug</th>
                                    <th>Servicios Configurados</th>
                                    <th className="text-end px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizations.map(org => (
                                    <tr key={org._id}>
                                        <td className="px-4 py-3 align-middle">
                                            <div className="fw-900 text-dark" style={{ letterSpacing: '-0.02em' }}>{org.name}</div>
                                        </td>
                                        <td className="align-middle"><code className="small px-2 py-1 bg-light rounded text-primary">{org.slug}</code></td>
                                        <td className="align-middle">
                                            <div className="d-flex gap-1 flex-wrap">
                                                {org.activeServices?.map(s => (
                                                    <span key={s} className="badge bg-light text-muted border" style={{ fontSize: '0.6rem' }}>{s}</span>
                                                ))}
                                                {(!org.activeServices || org.activeServices.length === 0) && <span className="text-danger small fw-800">Sin servicios</span>}
                                            </div>
                                        </td>
                                        <td className="text-end px-4 align-middle">
                                            <Button variant="light" size="sm" className="me-2" onClick={() => handleOpenForm('org', org)}><i className="bi bi-gear-fill"></i></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>

                    <Tab eventKey="users" title="Usuarios">
                        <div className="tab-header">
                            <span className="fw-800 text-muted small uppercase">Personal y Accesos</span>
                            <Button variant="primary" className="btn-premium-sm" onClick={() => handleOpenForm('user')}>+ Nuevo Usuario</Button>
                        </div>
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr className="small text-muted fw-800">
                                    <th className="px-4">Colaborador</th>
                                    <th>Email</th>
                                    <th>Empresa</th>
                                    <th>Rol / Nivel</th>
                                    <th className="text-end px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td className="px-4 py-3 fw-900 align-middle text-dark">{u.firstName} {u.lastName}</td>
                                        <td className="align-middle text-muted small fw-700">{u.email}</td>
                                        <td className="align-middle"><Badge bg="primary-subtle" className="text-primary rounded-pill px-3">{u.organization?.name || 'Inactivo'}</Badge></td>
                                        <td className="align-middle"><Badge bg="light" className="text-dark border px-2 py-1 text-uppercase" style={{ fontSize: '0.65rem' }}>{u.role}</Badge></td>
                                        <td className="text-end px-4 align-middle">
                                            <Button variant="light" size="sm" className="me-2 rounded-8" onClick={() => handleOpenForm('user', u)}><i className="bi bi-pencil-square"></i></Button>
                                            <Button variant="light" size="sm" className="text-danger rounded-8" onClick={() => handleDelete('user', u._id)}><i className="bi bi-trash3"></i></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>

                    <Tab eventKey="services" title="Catálogo de Servicios">
                        <div className="tab-header">
                            <span className="fw-800 text-muted small uppercase">Herramientas Disponibles</span>
                            <Button variant="success" className="btn-premium-sm" onClick={() => handleOpenForm('service')}>+ Nuevo Servicio</Button>
                        </div>
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr className="small text-muted fw-800">
                                    <th className="px-4">Módulo</th>
                                    <th>Slug</th>
                                    <th>Path</th>
                                    <th>Estado</th>
                                    <th className="text-end px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(s => (
                                    <tr key={s._id}>
                                        <td className="px-4 py-3 align-middle">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="p-2 rounded bg-light border text-primary"><i className={s.icon}></i></div>
                                                <span className="fw-900 text-dark">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="align-middle"><code className="small">{s.slug}</code></td>
                                        <td className="align-middle text-muted small">{s.path}</td>
                                        <td className="align-middle">
                                            <Badge bg={s.active ? 'success-subtle' : 'danger-subtle'} className={`text-${s.active ? 'success' : 'danger'} rounded-pill px-3`}>
                                                {s.active ? 'Activo' : 'Pausado'}
                                            </Badge>
                                        </td>
                                        <td className="text-end px-4 align-middle">
                                            <Button variant="light" size="sm" className="me-2" onClick={() => handleOpenForm('service', s)}><i className="bi bi-pencil"></i></Button>
                                            <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete('service', s._id)}><i className="bi bi-trash"></i></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>
                </Tabs>
            </div>

            {/* MODAL DE FORMULARIO PREMIUM DINÁMICO */}
            <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered size={modalType === 'org' ? 'lg' : 'md'} className="premium-modal">
                <style>{`
                    .premium-modal .modal-content { border-radius: 24px; border: none; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); }
                    .premium-modal .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; }
                    .premium-modal .modal-body { padding: 2rem; }
                    .premium-modal .modal-footer { padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #f1f5f9; }
                    .premium-modal .form-label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                    .premium-modal .form-control { border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 10px 16px; font-weight: 500; }
                `}</style>
                <Form onSubmit={handleSave}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-950">
                            {isEdit ? 'Editar' : 'Crear'} {modalType === 'org' ? 'Empresa' : modalType === 'user' ? 'Usuario' : 'Servicio'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {modalType === 'org' && (
                            <Row className="g-4">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Nombre Comercial</Form.Label>
                                        <Form.Control type="text" required value={formData.name || ''} 
                                            onChange={e => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Slug (Identificador)</Form.Label>
                                        <Form.Control type="text" required value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Label>Activar Herramientas en esta Empresa</Form.Label>
                                    <div className="d-grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        {services.map(service => (
                                            <div 
                                                key={service.slug} 
                                                className={`service-chip-select ${(formData.activeServices || []).includes(service.slug) ? 'active' : ''}`}
                                                onClick={() => {
                                                    const current = formData.activeServices || [];
                                                    const next = current.includes(service.slug) 
                                                        ? current.filter(s => s !== service.slug) 
                                                        : [...current, service.slug];
                                                    setFormData({...formData, activeServices: next});
                                                }}
                                            >
                                                <div className="service-icon-box" style={{ background: service.bgColor, color: service.color }}>
                                                    <i className={service.icon}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-900 small text-dark" style={{ lineHeight: 1 }}>{service.name}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.6rem' }}>{service.slug}</div>
                                                </div>
                                                {(formData.activeServices || []).includes(service.slug) && <i className="bi bi-check-circle-fill text-primary"></i>}
                                            </div>
                                        ))}
                                    </div>
                                </Col>
                            </Row>
                        )}

                        {modalType === 'user' && (
                            <Row className="g-4">
                                <Col md={6}><Form.Group><Form.Label>Nombre</Form.Label><Form.Control type="text" required value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} /></Form.Group></Col>
                                <Col md={6}><Form.Group><Form.Label>Apellido</Form.Label><Form.Control type="text" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} /></Form.Group></Col>
                                <Col md={12}><Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" required value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></Form.Group></Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Contraseña</Form.Label>
                                        <Form.Control type="password" required={!isEdit} placeholder={isEdit ? '••••••••' : ''} value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Rol</Form.Label>
                                        <Form.Select value={formData.role || 'agent'} onChange={e => setFormData({...formData, role: e.target.value})}>
                                            <option value="admin">Administrador</option>
                                            <option value="agent">Agente</option>
                                            <option value="viewer">Lector</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group>
                                        <Form.Label>Organización</Form.Label>
                                        <Form.Select required value={formData.organizationId || ''} onChange={e => setFormData({...formData, organizationId: e.target.value, organization: e.target.value})}>
                                            <option value="">Selecciona Empresa...</option>
                                            {organizations.map(org => <option key={org._id} value={org._id}>{org.name}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                {formData.organizationId && (
                                    <Col md={12}>
                                        <Form.Label>Accesos Específicos</Form.Label>
                                        <div className="p-3 bg-light rounded-4 d-flex flex-wrap gap-2 border">
                                            {organizations.find(o => o._id === formData.organizationId)?.activeServices.map(slug => (
                                                <Button 
                                                    key={slug}
                                                    variant={(formData.allowedServices || []).includes(slug) ? 'primary' : 'outline-secondary'}
                                                    className="btn-sm rounded-pill fw-800 border-0"
                                                    onClick={() => {
                                                        const current = formData.allowedServices || [];
                                                        setFormData({...formData, allowedServices: current.includes(slug) ? current.filter(x => x !== slug) : [...current, slug]});
                                                    }}
                                                >
                                                    {slug.toUpperCase()}
                                                </Button>
                                            ))}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        )}

                        {modalType === 'service' && (
                            <Row className="g-3">
                                <Col md={12}><Form.Group><Form.Label>Nombre del Servicio</Form.Label><Form.Control type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></Form.Group></Col>
                                <Col md={6}><Form.Group><Form.Label>Slug (Debe ser único)</Form.Label><Form.Control type="text" required value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} /></Form.Group></Col>
                                <Col md={6}><Form.Group><Form.Label>Path (URL Frontend)</Form.Label><Form.Control type="text" required placeholder="/ejemplo" value={formData.path || ''} onChange={e => setFormData({...formData, path: e.target.value})} /></Form.Group></Col>
                                <Col md={6}><Form.Group><Form.Label>Icono (Bootstrap Class)</Form.Label><Form.Control type="text" value={formData.icon || ''} onChange={e => setFormData({...formData, icon: e.target.value})} /></Form.Group></Col>
                                <Col md={6}><Form.Group><Form.Label>Color (Hex)</Form.Label><Form.Control type="color" value={formData.color || '#2563eb'} onChange={e => setFormData({...formData, color: e.target.value})} /></Form.Group></Col>
                                <Col md={12}><Form.Group><Form.Label>Descripción</Form.Label><Form.Control as="textarea" rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></Form.Group></Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" className="rounded-pill px-4 fw-800 shadow-sm border" onClick={() => setShowFormModal(false)}>Cerrar</Button>
                        <Button variant="primary" type="submit" className="rounded-pill px-5 fw-800 shadow-sm">Guardar Cambios</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminPortal;
