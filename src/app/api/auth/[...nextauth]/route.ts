import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const handler = NextAuth({
  debug: true, // Enable debug mode
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },      async authorize(credentials) {
        console.log('=== AUTHORIZE FUNCTION CALLED ===');
        console.log('Credentials received:', { 
          email: credentials?.email, 
          password: credentials?.password ? '[HIDDEN]' : 'missing' 
        });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials - returning null');
          return null;
        }

        try {
          console.log('Connecting to database...');
          await dbConnect();
          
          console.log('Authentication attempt for:', credentials.email);
          
          const user = await User.findOne({ email: credentials.email }).select('+password');
          
          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }
          
          console.log('User found:', { 
            id: user._id, 
            email: user.email, 
            name: user.name, 
            role: user.role, 
            isActive: user.isActive 
          });
          
          if (!user.isActive) {
            console.log('User is not active:', credentials.email);
            return null;
          }

          const isPasswordValid = await user.comparePassword(credentials.password);
          console.log('Password validation result:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('Invalid password for:', credentials.email);
            return null;
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          const userObj = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar || '',
          };
          
          console.log('=== RETURNING USER OBJECT ===');
          console.log('User object:', JSON.stringify(userObj, null, 2));
          return userObj;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback - user:', user, 'token:', token);
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - session:', session, 'token:', token);
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
