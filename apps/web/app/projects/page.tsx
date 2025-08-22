"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    role?: string;
    isOwner?: boolean;
    userId?: number;
}

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [collaborators, setCollaborators] = useState<Array<{ id: number; role: string; user: { id: number; email: string; name: string | null } }>>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'view' | 'edit'>('view');
    const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
    const [collabError, setCollabError] = useState('');
    const router = useRouter();

    const generateUniqueProjectName = (baseName: string): string => {
        const existingNames = new Set(projects.map(p => p.name));
        let newName = baseName;
        let counter = 1;

        while (existingNames.has(newName)) {
            newName = `${baseName} (${counter})`;
            counter++;
        }

        return newName;
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
                const token = localStorage.getItem('authToken');
                
                if (!token) {
                    console.log('No token found, redirecting to home');
                    router.push('/');
                    return;
                }

                console.log('Fetching projects with token:', token);
                const response = await fetch(`${backendUrl}/api/allprojects`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                console.log('Response status:', response.status);
                const contentType = response.headers.get('content-type');
                console.log('Content-Type:', contentType);

                if (response.status === 401) {
                    console.log('Unauthorized, redirecting to home');
                    router.push('/');
                    return;
                }

                if (!response.ok) {
                    const text = await response.text();
                    console.error('Error response:', text);
                    throw new Error('Failed to fetch projects');
                }

                const data = await response.json();
                console.log('Received data:', data);
                console.log('Raw response data type:', typeof data);
                console.log('Raw response data keys:', Object.keys(data));
                
                if (data.projects) {
                    console.log('Projects array type:', typeof data.projects);
                    console.log('Projects array length:', data.projects.length);
                    console.log('Setting projects with detailed info:');
                    data.projects.forEach((project: any, index: number) => {
                        console.log(`Project ${index}:`, {
                            id: project.id,
                            name: project.name,
                            isOwner: project.isOwner,
                            role: project.role,
                            userId: project.userId
                        });
                        console.log(`Project ${index} raw object:`, project);
                        console.log(`Project ${index} hasOwnProperty isOwner:`, project.hasOwnProperty('isOwner'));
                        console.log(`Project ${index} hasOwnProperty role:`, project.hasOwnProperty('role'));
                    });
                    setProjects(data.projects);
                } else {
                    setProjects([]);
                }
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError(err instanceof Error ? err.message : 'Failed to load projects');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [router]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!confirm('Are you sure you want to delete this project?')) {
            return;
        }

        setIsDeleting(projectId);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.error('No token found');
                router.push('/');
                return;
            }

            console.log('Attempting to delete project:', projectId);
            console.log('Using token:', token);

            const response = await fetch(`${backendUrl}/api/deleteproject?id=${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Delete response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete project');
            }

            // Remove the deleted project from the state
            setProjects(prev => prev.filter(project => project.id !== projectId));
            console.log('Project removed from state');
        } catch (err) {
            console.error('Error deleting project:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete project');
        } finally {
            setIsDeleting(null);
        }
    };

    const openCollaboratorsModal = async (projectId: number) => {
        setActiveProjectId(projectId);
        setIsCollabModalOpen(true);
        setCollabError('');
        setInviteEmail('');
        setInviteRole('view');
        setIsLoadingCollaborators(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
            const token = localStorage.getItem('authToken');
            if (!token) {
                setCollabError('Not authenticated');
                return;
            }
            const res = await fetch(`${backendUrl}/api/projects/${projectId}/collaborators`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Failed to fetch collaborators');
            }
            const data = await res.json();
            setCollaborators(data.collaborators || []);
        } catch (e: any) {
            setCollabError(e.message || 'Failed to load collaborators');
        } finally {
            setIsLoadingCollaborators(false);
        }
    };

    const inviteCollaborator = async () => {
        if (!activeProjectId || !inviteEmail.trim()) return;
        setCollabError('');
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
            const token = localStorage.getItem('authToken');
            if (!token) {
                setCollabError('Not authenticated');
                return;
            }
            const res = await fetch(`${backendUrl}/api/projects/${activeProjectId}/collaborators`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Failed to add collaborator');
            }
            await openCollaboratorsModal(activeProjectId); // reload list
            setInviteEmail('');
            setInviteRole('view');
        } catch (e: any) {
            setCollabError(e.message || 'Failed to add collaborator');
        }
    };

    const updateCollaboratorRole = async (userId: number, role: 'view' | 'edit') => {
        if (!activeProjectId) return;
        setCollabError('');
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
            const token = localStorage.getItem('authToken');
            if (!token) {
                setCollabError('Not authenticated');
                return;
            }
            const res = await fetch(`${backendUrl}/api/projects/${activeProjectId}/collaborators`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, role })
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Failed to update collaborator');
            }
            setCollaborators(prev => prev.map(c => c.user.id === userId ? { ...c, role } : c));
        } catch (e: any) {
            setCollabError(e.message || 'Failed to update collaborator');
        }
    };

    const removeCollaborator = async (userId: number) => {
        if (!activeProjectId) return;
        setCollabError('');
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
            const token = localStorage.getItem('authToken');
            if (!token) {
                setCollabError('Not authenticated');
                return;
            }
            const res = await fetch(`${backendUrl}/api/projects/${activeProjectId}/collaborators?userId=${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Failed to remove collaborator');
            }
            setCollaborators(prev => prev.filter(c => c.user.id !== userId));
        } catch (e: any) {
            setCollabError(e.message || 'Failed to remove collaborator');
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            return;
        }

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.error('No token found');
                router.push('/');
                return;
            }

            const uniqueName = generateUniqueProjectName(newProjectName.trim());

            const response = await fetch(`${backendUrl}/api/createProject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    tittle: uniqueName,
                    data: '<p>Start writing your content here...</p>'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create project');
            }

            const data = await response.json();
            if (data.fileId) {
                router.push(`/editor?id=${data.fileId}`);
            }
        } catch (err) {
            console.error('Error creating project:', err);
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setIsDialogOpen(false);
            setNewProjectName('');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0f172a] pt-28 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your projects...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0f172a] pt-28 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
                    <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0f172a] pt-28">
            <div className="mx-auto max-w-7xl px-6">
                {/* Header Section */}
                <div className="mb-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                                Your Projects
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                                Manage and organize all your documents in one place. Create new projects, collaborate with others, and keep everything organized.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            New Project
                        </button>
                    </div>
                </div>

                {/* Create Project Modal */}
                {isDialogOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">Give your project a meaningful name</p>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Enter project name"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        setNewProjectName('');
                                    }}
                                    className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!newProjectName.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Project
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">No projects yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                            Create your first project to get started, or ask someone to invite you to collaborate on their project!
                        </p>
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Create Your First Project
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:-translate-y-1 relative overflow-hidden"
                            >
                                {/* Project Card Content */}
                                <div 
                                    onClick={() => router.push(`/editor?id=${project.id}`)}
                                    className="cursor-pointer p-6 h-full flex flex-col"
                                >
                                    {/* Project Icon */}
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    
                                    {/* Project Title */}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {project.name}
                                    </h3>
                                    
                                    {/* Project Details */}
                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4 flex-grow">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Created {formatDate(project.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Updated {formatDate(project.updatedAt)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Role Badge and Actions */}
                                    <div className="flex items-center justify-between">
                                        <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                                            project.isOwner === true
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                                                : project.role === 'edit'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                        }`}>
                                            {project.isOwner === true ? 'Owner' : project.role === 'edit' ? 'Editor' : 'Viewer'}
                                        </span>
                                        
                                        {/* Collaborators button - only show for owners */}
                                        {project.isOwner === true && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openCollaboratorsModal(project.id);
                                                }}
                                                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                                            >
                                                Manage
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Delete button - only show for owners */}
                                {project.isOwner === true && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project.id);
                                        }}
                                        disabled={isDeleting === project.id}
                                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                                        title="Delete project"
                                    >
                                        {isDeleting === project.id ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"></div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8zm5-1a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Collaborators Modal */}
            {isCollabModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Collaborators</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Invite team members and manage their permissions</p>
                            </div>
                            <button
                                onClick={() => { setIsCollabModalOpen(false); setActiveProjectId(null); setCollaborators([]); }}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {collabError && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                {collabError}
                            </div>
                        )}

                        {/* Invite Section */}
                        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite New Collaborator</h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as 'view' | 'edit')}
                                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="view">View Only</option>
                                    <option value="edit">Can Edit</option>
                                </select>
                                <button
                                    onClick={inviteCollaborator}
                                    disabled={!inviteEmail.trim() || !activeProjectId}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    Send Invite
                                </button>
                            </div>
                        </div>

                        {/* Current Collaborators */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Collaborators</h3>
                            {isLoadingCollaborators ? (
                                <div className="py-12 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : collaborators.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg">No collaborators yet</p>
                                    <p className="text-sm">Invite team members to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {collaborators.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                    {(c.user.name && c.user.name[0] ? c.user.name[0].toUpperCase() : (c.user.email?.[0]?.toUpperCase() || '?'))}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                                        {c.user.name || 'Unnamed User'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {c.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={c.role as 'view' | 'edit'}
                                                    onChange={(e) => updateCollaboratorRole(c.user.id, e.target.value as 'view' | 'edit')}
                                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                >
                                                    <option value="view">View Only</option>
                                                    <option value="edit">Can Edit</option>
                                                </select>
                                                <button
                                                    onClick={() => removeCollaborator(c.user.id)}
                                                    className="px-3 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg text-sm transition-all duration-200"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => { setIsCollabModalOpen(false); setActiveProjectId(null); setCollaborators([]); }}
                                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}