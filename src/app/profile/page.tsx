
'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/shared/AppHeader';
import AuthCheck from '@/components/shared/AuthCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { List, Mail, Building, Briefcase, Clock, User as UserIcon, Camera, LoaderCircle } from 'lucide-react';
import type { ActivityLog } from '@/lib/types';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateUserProfilePicture } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getAllActivityAction } from '@/lib/firebase-admin';

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | undefined }) => (
    <div className="flex items-center text-sm">
        <div className="w-6 mr-4 text-primary">{icon}</div>
        <div className="text-muted-foreground mr-2">{label}:</div>
        <div className="font-medium text-card-foreground">{value || 'N/A'}</div>
    </div>
);

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            const fetchLogs = async () => {
                const result = await getAllActivityAction();
                if (result.success && result.activities) {
                    const userLogs = result.activities.filter(log => log.uid === user.uid);
                    setRecentActivity(userLogs.slice(0, 10));
                }
            }
            fetchLogs();
        }
    }, [user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 1024 * 1024) { // 1MB limit
            toast({
                title: "File Too Large",
                description: "Please upload an image smaller than 1MB.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        try {
            const storageRef = ref(storage, `profile-pictures/${user.uid}`);
            const snapshot = await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(snapshot.ref);

            await updateUserProfilePicture(user.uid, photoURL);

            // Update user in context
            const updatedUser = { ...user, photoURL };
            setUser(updatedUser);

            toast({ title: "Success", description: "Profile picture updated successfully." });
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            toast({ title: "Error", description: "Failed to upload profile picture.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };


    if (!user) return null;
    
    const userShift = user.shift && SHIFTS[user.shift] ? SHIFTS[user.shift].name : 'Not Assigned';

    return (
        <AuthCheck>
            <AppHeader />
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-white font-headline">My Profile</h2>
                    <p className="text-lg text-foreground mt-2">View and manage your account details and recent activity.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative group">
                                        <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
                                            <AvatarImage src={user.photoURL} alt={user.name} />
                                            <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="absolute bottom-4 right-0 rounded-full h-8 w-8 bg-background/80 hover:bg-background group-hover:opacity-100 md:opacity-0 transition-opacity"
                                            onClick={handleAvatarClick}
                                            disabled={uploading}
                                        >
                                            {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 text-primary" />}
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/png, image/jpeg"
                                        />
                                    </div>
                                    <h3 className="text-2xl font-bold text-card-foreground font-headline">{user.name}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2">
                        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center"><UserIcon className="mr-2 h-5 w-5 text-primary" /> User Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <InfoRow icon={<Mail />} label="Email" value={user.email} />
                               <InfoRow icon={<Building />} label="Department" value={user.department} />
                               <InfoRow icon={<Briefcase />} label="Role" value={user.role} />
                               <InfoRow icon={<Clock />} label="Shift" value={userShift} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="mt-8 bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center"><List className="mr-2 h-5 w-5 text-primary" />Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? recentActivity.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-card-foreground">{log.action}</p>
                                        <p className="text-sm text-muted-foreground">{log.date} at {log.time}</p>
                                    </div>
                                    {log.duration && <Badge variant="secondary">{log.duration} min</Badge>}
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-4">No recent activity to display.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </AuthCheck>
    );
}
