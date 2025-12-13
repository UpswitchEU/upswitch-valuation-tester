/**
 * ServiceProvider - React Context for Dependency Injection
 *
 * Provides service container to React component tree.
 * Enables components to depend on abstractions rather than concretions.
 */

import { createContext, ReactNode, useContext } from 'react';
import { ServiceContainer } from './ServiceContainer';

// Create context for service container
const ServiceContainerContext = createContext<ServiceContainer | null>(null);

/**
 * Service Provider Component
 *
 * Wraps the application to provide service container to all components.
 */
export interface ServiceProviderProps {
  children: ReactNode;
  container?: ServiceContainer; // Allow injection of custom container (for testing)
}

export function ServiceProvider({
  children,
  container = ServiceContainer.getInstance()
}: ServiceProviderProps) {
  return (
    <ServiceContainerContext.Provider value={container}>
      {children}
    </ServiceContainerContext.Provider>
  );
}

/**
 * Hook to access services from container
 *
 * Usage:
 * const valuationService = useService<IValuationService>('IValuationService');
 * const logger = useService<ILogger>('ILogger');
 */
export function useService<T>(interfaceName: string): T {
  const container = useContext(ServiceContainerContext);

  if (!container) {
    throw new Error('useService must be used within a ServiceProvider');
  }

  return container.resolve<T>(interfaceName);
}

/**
 * Hook to access the entire service container
 *
 * Usage:
 * const container = useServiceContainer();
 * const service = container.resolve<ISomeService>('ISomeService');
 */
export function useServiceContainer(): ServiceContainer {
  const container = useContext(ServiceContainerContext);

  if (!container) {
    throw new Error('useServiceContainer must be used within a ServiceProvider');
  }

  return container;
}