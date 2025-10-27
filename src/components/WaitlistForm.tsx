import React from 'react';

interface WaitlistFormProps {
  feature?: string;
  description?: string;
}

/**
 * WaitlistForm Component
 * 
 * Placeholder component for waitlist functionality.
 * TODO: Implement full waitlist form functionality
 */
const WaitlistForm: React.FC<WaitlistFormProps> = ({ feature, description }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">{feature || 'Join Our Waitlist'}</h3>
      <p className="text-gray-600 mb-4">
        {description || 'This feature is coming soon. Join our waitlist to be notified when it\'s available.'}
      </p>
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Join Waitlist
        </button>
      </form>
    </div>
  );
};

export default WaitlistForm;

