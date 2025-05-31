"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
                
                if (!token) {
                    console.log('No token found, redirecting to home');
                    router.push('/');
                    return;
                }

                console.log('Fetching projects with token:', token);
                const response = await fetch('http://localhost:3002/allprojects', {
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
                
                if (data.projects) {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
                    <button
                        onClick={() => router.push('/editor')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        New Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
                        <p className="mt-2 text-gray-500">Create your first project to get started!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/editor?id=${project.id}`)}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                                <div className="text-sm text-gray-500">
                                    <p>Created: {formatDate(project.createdAt)}</p>
                                    <p>Last updated: {formatDate(project.updatedAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}