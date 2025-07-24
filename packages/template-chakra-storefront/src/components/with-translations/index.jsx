// hoc/withTranslations.js
import { useIntl } from 'react-intl';

/**
 * Higher-Order Component that abstracts React Intl complexity from components
 * and provides a clean, magical messages API for internationalization.
 * 
 * WHY THIS HOC IS NEEDED:
 * - Eliminates repetitive useIntl() and formatMessage() calls in every component
 * - Keeps JSX clean and readable without i18n clutter
 * - Abstracts React Intl complexity away from component logic
 * - Provides type-safe message references instead of magic strings
 * - Enables static analysis for message extraction while maintaining clean syntax
 * 
 * @param {React.Component} Component - The React component to enhance with translations
 * @param {Object} messageDefinitions - Message definitions object created with defineMessages()
 * 
 * @returns {React.Component} Enhanced component that receives a magical `messages` prop
 * 
 * @example
 * // 1. Define messages using defineMessages
 * const userMessages = defineMessages({
 *   welcome: {
 *     id: 'user.welcome',
 *     defaultMessage: 'Welcome, {name}!'
 *   },
 *   title: {
 *     id: 'user.title', 
 *     defaultMessage: 'User Dashboard'
 *   }
 * });
 * 
 * // 2. Create pure component (no i18n imports needed)
 * const UserDashboard = ({ messages, user }) => (
 *   <div>
 *     <h1>{messages.title}</h1>
 *     <p>{messages.welcome({ name: user.name })}</p>
 *   </div>
 * );
 * 
 * // 3. Wrap component with HOC
 * export default withTranslations(UserDashboard, userMessages);
 * 
 * MAGICAL MESSAGES API:
 * The `messages` prop provides a magical object where each message key works in multiple ways:
 * 
 * Static usage (no parameters needed):
 *   {messages.title} → "User Dashboard"
 * 
 * Dynamic usage (with interpolation):
 *   {messages.welcome({ name: 'John' })} → "Welcome, John!"
 *   {messages.welcome.format({ name: 'John' })} → "Welcome, John!" (alternative syntax)
 * 
 * JavaScript usage (for alerts, confirmations, etc.):
 *   const msg = messages.welcome({ name: user.name });
 *   alert(msg);
 * 
 * HOW THE MAGIC WORKS:
 * - Uses JavaScript Proxy to intercept property access
 * - Each message becomes a hybrid object that's both a string and a function
 * - toString() and valueOf() methods provide automatic string conversion
 * - Function interface allows dynamic parameter injection
 * - Maintains all original message definition properties for compatibility
 * 
 * BENEFITS:
 * ✅ Clean JSX: {messages.key} instead of {intl.formatMessage(...)}
 * ✅ Single prop: Only need to pass `messages` to components
 * ✅ Type-safe: Real message objects instead of string keys
 * ✅ Component-controlled: Data for interpolation stays in the component
 * ✅ Static analysis compatible: Works with React Intl extraction tools
 * ✅ No imports: Components don't need to import React Intl
 * ✅ Testable: Pure components are easy to unit test
 * ✅ Reusable: Same HOC works with any message definitions
 */
export function withTranslations(Component, messageDefinitions) {
  return function WrappedComponent(props) {
    const intl = useIntl();
    
    // Create a magical messages object using Proxy
    const messages = new Proxy({}, {
      get(target, prop) {
        if (!messageDefinitions[prop]) {
          console.warn(`Message key "${prop}" not found`);
          return prop;
        }
        
        // Return an object that acts as both string and message definition
        const messageDefinition = messageDefinitions[prop];
        const staticMessage = intl.formatMessage(messageDefinition);
        
        // Create a function that can be called for dynamic formatting
        const dynamicFormatter = (values = {}) => intl.formatMessage(messageDefinition, values);
        
        // Create a magical object that behaves as both string and message definition
        const magicalMessage = Object.assign(dynamicFormatter, {
          // When used as string (in JSX), return the static message
          toString: () => staticMessage,
          valueOf: () => staticMessage,
          
          // When used as message definition, expose the definition properties
          id: messageDefinition.id,
          defaultMessage: messageDefinition.defaultMessage,
          description: messageDefinition.description,
          
          // For explicit formatting calls
          format: dynamicFormatter
        });
        
        return magicalMessage;
      }
    });
    
    // Pass only the magical messages object - no formatMessage needed!
    return <Component {...props} messages={messages} />;
  };
}