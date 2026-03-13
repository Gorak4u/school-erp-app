// Simple Design System Demo
import React from 'react';
import { Button } from './components/Button-simple';

export const SimpleDemo = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#212121',
          marginBottom: '0.5rem'
        }}>
          School ERP Design System
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: '#757575',
          marginBottom: '1rem'
        }}>
          A comprehensive design system for educational platforms
        </p>
      </header>

      <main>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#212121',
            marginBottom: '1rem'
          }}>
            Button Components
          </h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '500', 
              color: '#212121',
              marginBottom: '0.5rem'
            }}>
              Variants
            </h3>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexWrap: 'wrap',
              marginBottom: '1rem'
            }}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="error">Error</Button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '500', 
              color: '#212121',
              marginBottom: '0.5rem'
            }}>
              Sizes
            </h3>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1rem'
            }}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '500', 
              color: '#212121',
              marginBottom: '0.5rem'
            }}>
              States
            </h3>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexWrap: 'wrap',
              marginBottom: '1rem'
            }}>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#212121',
            marginBottom: '1rem'
          }}>
            Interactive Demo
          </h2>
          
          <div style={{ 
            padding: '2rem', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '1rem'
          }}>
            <p style={{ marginBottom: '1rem' }}>
              Click the buttons below to see interactive states:
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={() => alert('Primary button clicked!')}
              >
                Click Me!
              </Button>
              <Button 
                variant="success" 
                onClick={() => alert('Success button clicked!')}
              >
                Success Action
              </Button>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#212121',
            marginBottom: '1rem'
          }}>
            Design Tokens
          </h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '500', 
              color: '#212121',
              marginBottom: '0.5rem'
            }}>
              Color Palette
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ padding: '1rem', backgroundColor: '#2196f3', color: 'white', borderRadius: '8px' }}>
                Primary Blue (#2196f3)
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#4caf50', color: 'white', borderRadius: '8px' }}>
                Success Green (#4caf50)
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#03a9f4', color: 'white', borderRadius: '8px' }}>
                Secondary Blue (#03a9f4)
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f44336', color: 'white', borderRadius: '8px' }}>
                Error Red (#f44336)
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ 
        marginTop: '2rem', 
        paddingTop: '2rem', 
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center'
      }}>
        <p style={{ color: '#757575', marginBottom: '0.5rem' }}>
          School ERP Design System v1.0.0
        </p>
        <p style={{ color: '#9e9e9e', marginBottom: '0' }}>
          Built with React, TypeScript, and CSS-in-JS
        </p>
      </footer>
    </div>
  );
};

export default SimpleDemo;
