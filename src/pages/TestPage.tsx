import React from 'react';

export function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-4">Application Status</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>✅ Application is running successfully</p>
            <p>✅ All components are loaded</p>
            <p>✅ No emotion detection dependencies</p>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Clean Application</h3>
            <p className="text-green-700 text-sm">
              This application has been cleaned of all emotion detection functionality 
              and is ready for new features to be added.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestPage;