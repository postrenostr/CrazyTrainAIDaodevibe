# Project Overview

## Overview

SubService is a subscription-based web application built with a modern full-stack architecture. The application provides user authentication through Replit's authentication system and integrates with Stripe for payment processing and subscription management. Users can sign up, manage subscriptions, and access premium features through a clean, responsive interface built with React and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Hookform resolvers for form validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL session store
- **Payment Processing**: Stripe integration for subscription management
- **Build System**: ESBuild for server-side bundling

### Database Design
- **Primary Database**: PostgreSQL with Neon Database as the provider
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Tables**:
  - `users` - User profiles with Stripe customer/subscription data
  - `sessions` - Session storage for authentication (required for Replit Auth)

### Authentication & Authorization
- **Primary Auth**: Replit Authentication with OIDC integration
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Security**: HTTP-only cookies with secure flags for production
- **User Data**: Automatic user profile creation and updates through OIDC claims

### Payment Integration
- **Payment Provider**: Stripe with full subscription lifecycle management
- **Subscription Features**:
  - Subscription creation and payment processing
  - Customer portal access for subscription management
  - Webhook handling for subscription status updates
  - Automatic user status synchronization

### Development & Deployment
- **Development**: Vite dev server with HMR and Express middleware integration
- **Production Build**: Static asset generation with server bundling
- **Environment**: Replit-optimized with development banner and error overlays
- **TypeScript**: Full TypeScript support across frontend, backend, and shared modules

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL database hosting with serverless capabilities
- **Stripe**: Payment processing and subscription management platform
- **Replit Auth**: Authentication service with OIDC integration

### Key Libraries
- **Frontend**: React, TanStack Query, Wouter, React Hook Form, shadcn/ui, Tailwind CSS
- **Backend**: Express.js, Drizzle ORM, Passport.js, connect-pg-simple
- **Payment**: @stripe/stripe-js, @stripe/react-stripe-js
- **Development**: Vite, ESBuild, TypeScript, Replit development tools

### UI Components
- **Component System**: Radix UI primitives with shadcn/ui styling
- **Icons**: Lucide React icons with Font Awesome integration
- **Styling**: Tailwind CSS with CSS custom properties for theming