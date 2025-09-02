import type { User } from './types';

const defaultUsers: User[] = [
  {
    uid: 'admin001',
    name: 'System Administrator',
    email: 'admin123@gmail.com',
    password: 'sigma88',
    department: 'Admin',
    role: 'Administrator',
  },
  {
    uid: 'user001',
    name: 'John Doe',
    email: 'user123@gmail.com',
    password: 'terra123',
    department: 'Dealing',
    role: 'Employee',
  },
];

export const seedInitialData = () => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }
};

export const authenticateUser = (email: string, pass: string): User | null => {
  const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email && u.password === pass);
  return user || null;
};

export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem('users') || '[]');
};

export const addUser = (newUser: Omit<User, 'uid'>): User => {
    const users = getUsers();
    const userWithId: User = { ...newUser, uid: `user${Date.now()}` };
    users.push(userWithId);
    localStorage.setItem('users', JSON.stringify(users));
    return userWithId;
};
