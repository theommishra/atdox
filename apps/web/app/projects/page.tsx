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
                const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
                
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
                    },
                    credentials: 'include'
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
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
            
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
                },
                credentials: 'include'
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
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
            if (!token) {
                setCollabError('Not authenticated');
                return;
            }
            const res = await fetch(`${backendUrl}/api/projects/${projectId}/collaborators`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
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
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
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
                credentials: 'include',
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
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
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
                credentials: 'include',
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
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
            if (!token) {
                setCollabError('Not authenticated');
                return;
            }
            const res = await fetch(`${backendUrl}/api/projects/${activeProjectId}/collaborators?userId=${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
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
            const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
            
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
                credentials: 'include',
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
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">All Projects</h1>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        New Project
                    </button>
                </div>

                {isDialogOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Project</h2>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Enter project name"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        setNewProjectName('');
                                    }}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!newProjectName.trim()}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {projects.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No projects yet</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Create your first project or ask someone to invite you to collaborate!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative group"
                            >
                                <div 
                                    onClick={() => router.push(`/editor?id=${project.id}`)}
                                    className="cursor-pointer"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h3>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        <p>Created: {formatDate(project.createdAt)}</p>
                                        <p>Last updated: {formatDate(project.updatedAt)}</p>
                                    </div>
                                </div>
                                       <div className="mt-4 flex gap-2 items-center">
           {/* Role badge */}
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        project.isOwner === true
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                            : project.role === 'edit'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                    }`}>
                                        {project.isOwner === true ? 'Owner' : project.role === 'edit' ? 'Editor' : 'Viewer'}
                                    </span>
                                    
                                    {/* Collaborators button - only show for owners */}
                                    {project.isOwner === true && (
                                        <button
                                            onClick={() => openCollaboratorsModal(project.id)}
                                            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                        >
                                            Collaborators
                                        </button>
                                    )}
                                </div>
                                
                                {/* Delete button - only show for owners */}
                                {project.isOwner === true && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project.id);
                                        }}
                                        disabled={isDeleting === project.id}
                                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
            {isCollabModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Manage Collaborators</h2>
                            <button
                                onClick={() => { setIsCollabModalOpen(false); setActiveProjectId(null); setCollaborators([]); }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {collabError && (
                            <div className="mb-3 text-sm text-red-600 dark:text-red-400">{collabError}</div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invite by Email</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as 'view' | 'edit')}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="view">View</option>
                                    <option value="edit">Edit</option>
                                </select>
                                <button
                                    onClick={inviteCollaborator}
                                    disabled={!inviteEmail.trim() || !activeProjectId}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Invite
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Collaborators</h3>
                            {isLoadingCollaborators ? (
                                <div className="py-6 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : collaborators.length === 0 ? (
                                <div className="text-gray-500 dark:text-gray-400 text-sm">No collaborators yet.</div>
                            ) : (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {collaborators.map((c) => (
                                        <li key={c.id} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                                    {(c.user.name && c.user.name[0] ? c.user.name[0].toUpperCase() : (c.user.email?.[0]?.toUpperCase() || '?'))}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.user.name || c.user.email}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.user.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={c.role as 'view' | 'edit'}
                                                    onChange={(e) => updateCollaboratorRole(c.user.id, e.target.value as 'view' | 'edit')}
                                                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                >
                                                    <option value="view">View</option>
                                                    <option value="edit">Edit</option>
                                                </select>
                                                <button
                                                    onClick={() => removeCollaborator(c.user.id)}
                                                    className="px-2 py-1 text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => { setIsCollabModalOpen(false); setActiveProjectId(null); setCollaborators([]); }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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

// Collaborators Modal
// Placed at file end to keep component simple
// Inline within same component tree for simplicity
// Rendering conditionally when isCollabModalOpen is true
/* eslint-disable @next/next/no-img-element */