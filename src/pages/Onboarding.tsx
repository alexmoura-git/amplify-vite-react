/**
 * Onboarding Page
 *
 * Authentication and initial setup
 */

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '../styles/Onboarding.css';

export default function Onboarding() {
  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <div className="branding">
          <h1>GenAI Book Studio</h1>
          <p>Transform your ideas into published books with AI-powered writing assistance</p>
        </div>

        <Authenticator>
          {({ signOut, user }) => (
            <div className="welcome">
              <h2>Welcome, {user?.signInDetails?.loginId}!</h2>
              <p>You're all set. Let's start writing your book.</p>
              <button onClick={signOut}>Sign out</button>
            </div>
          )}
        </Authenticator>

        <div className="features">
          <div className="feature">
            <h3>📝 Structured Workflow</h3>
            <p>From brief to final export, follow proven editorial processes</p>
          </div>
          <div className="feature">
            <h3>🤖 AI Assistance</h3>
            <p>Multi-agent system guides you through every writing stage</p>
          </div>
          <div className="feature">
            <h3>📚 Version Control</h3>
            <p>Track every change, compare versions, and never lose work</p>
          </div>
          <div className="feature">
            <h3>✏️ Editorial Passes</h3>
            <p>Professional editing workflows built-in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
