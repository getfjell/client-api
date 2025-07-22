import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import './App.css'

interface DocumentSection {
  id: string;
  title: string;
  subtitle: string;
  file: string;
  content?: string;
}

const documentSections: DocumentSection[] = [
  { id: 'overview', title: 'Foundation', subtitle: 'Core concepts & client patterns', file: '/client-api/README.md' },
  { id: 'getting-started', title: 'Getting Started', subtitle: 'Your first HTTP client setup', file: '/client-api/examples-README.md' },
  { id: 'examples', title: 'Examples', subtitle: 'API patterns & usage scenarios', file: '/client-api/examples-README.md' },
  { id: 'api-reference', title: 'API Reference', subtitle: 'Complete API documentation', file: '/client-api/api-reference.md' }
];

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState('overview')
  const [documents, setDocuments] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [version, setVersion] = useState<string>('4.4.9')

  useEffect(() => {
    const loadDocuments = async () => {
      const loadedDocs: { [key: string]: string } = {}

      for (const section of documentSections) {
        try {
          const response = await fetch(section.file)

          if (response.ok) {
            loadedDocs[section.id] = await response.text()
          } else {
            // Fallback content for missing files
            loadedDocs[section.id] = getFallbackContent(section.id)
          }
        } catch (error) {
          console.error(`Error loading ${section.file}:`, error)
          loadedDocs[section.id] = getFallbackContent(section.id)
        }
      }

      setDocuments(loadedDocs)
      setLoading(false)
    }

    const loadVersion = async () => {
      try {
        const response = await fetch('/client-api/package.json')
        if (response.ok) {
          const packageData = await response.json()
          setVersion(packageData.version)
          console.log('Version loaded:', packageData.version)
        } else {
          console.error('Failed to fetch package.json:', response.status)
          setVersion('4.4.9') // Fallback version
        }
      } catch (error) {
        console.error('Error loading version:', error)
        setVersion('4.4.9') // Fallback version
      }
    }

    loadDocuments()
    loadVersion()
  }, [])

  const getFallbackContent = (sectionId: string): string => {
    switch (sectionId) {
      case 'overview':
        return `# Fjell Client API

A comprehensive HTTP client library for the Fjell ecosystem.
The Client API provides powerful abstractions for HTTP-based data operations,
making it easy to build robust client applications that consume REST APIs.

## Installation

\`\`\`bash
npm install @fjell/client-api
\`\`\`

## Quick Start

\`\`\`typescript
import { createPItemApi, createCItemApi } from '@fjell/client-api'

// Configure API endpoints
const apiConfig = {
  baseUrl: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' }
}

// Create Primary Item API (independent entities)
const userApi = createPItemApi<User, 'user'>('user', ['users'], apiConfig)

// Create Contained Item API (hierarchical entities)
const taskApi = createCItemApi<Task, 'task', 'user'>('task', ['users', 'tasks'], apiConfig)

// Basic operations
const users = await userApi.all(query)
const user = await userApi.create(userData)
const tasks = await taskApi.all(query, [userId]) // Location-based query
\`\`\`

## Key Features

- **HTTP-based Operations**: Complete CRUD operations over HTTP
- **Type-safe APIs**: Full TypeScript support with generic type parameters
- **Hierarchical Data**: Support for nested resource relationships
- **Business Logic**: Actions and facets for complex operations
- **Authentication**: Built-in support for various auth patterns
- **Error Handling**: Comprehensive error handling and retry logic

## Architecture

The Client API is built around two main concepts:

### Primary Items (PItemApi)
Independent entities that exist at the top level of your API hierarchy.

### Contained Items (CItemApi)
Entities that belong to parent resources and require location context.

This design mirrors RESTful API patterns while providing powerful abstractions for complex business operations.`

      case 'getting-started':
        return `# Getting Started with Fjell Client API

Learn how to set up and use the Fjell Client API for HTTP-based data operations.

## Installation

\`\`\`bash
npm install @fjell/client-api
\`\`\`

## Basic Configuration

\`\`\`typescript
import { createPItemApi, createCItemApi } from '@fjell/client-api'

const config = {
  baseUrl: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  }
}
\`\`\`

## Your First API

\`\`\`typescript
// Define your data types
interface User {
  id: string
  name: string
  email: string
}

// Create API instance
const userApi = createPItemApi<User, 'user'>('user', ['users'], config)

// Use the API
const users = await userApi.all()
const user = await userApi.create({ name: 'John', email: 'john@example.com' })
\`\`\`

See the Examples section for more detailed patterns and use cases.`

      case 'examples':
        return `# Examples

Comprehensive examples demonstrating various Client API patterns.

## Available Examples

### Simple Example
Basic CRUD operations with Primary and Contained APIs.

### Multi-Level Keys
Complex hierarchical data structures with nested relationships.

### Enterprise Example
Full business application with multiple interconnected entities.

Run examples locally:

\`\`\`bash
npx tsx examples/simple-example.ts
npx tsx examples/multi-level-keys.ts
npx tsx examples/enterprise-example.ts
\`\`\`

Each example includes detailed documentation and demonstrates different aspects of the Client API.`

      case 'api-reference':
        return `# API Reference

Complete reference for all Client API interfaces and methods.

## PItemApi<V, S>

Primary Item API for independent entities.

### Methods

- \`all(query?: ItemQuery): Promise<V[]>\`
- \`create(item: Partial<Item<S>>): Promise<V>\`
- \`get(key: PriKey<S>): Promise<V>\`
- \`update(key: PriKey<S>, updates: Partial<Item<S>>): Promise<V>\`
- \`remove(key: PriKey<S>): Promise<boolean>\`
- \`action(key: PriKey<S>, action: string, body?: any): Promise<any>\`
- \`facet(key: PriKey<S>, facet: string, params?: any): Promise<any>\`

## CItemApi<V, S, L1, L2, L3, L4, L5>

Contained Item API for hierarchical entities.

### Methods

All PItemApi methods plus location-aware variants:

- \`all(query: ItemQuery, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V[]>\`
- \`create(item: Partial<Item<S>>, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V>\`

And more...`

      default:
        return `# ${sectionId}

Documentation for this section is being prepared.`
    }
  }

  const currentContent = documents[currentSection] || ''

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <div className="brand">
            <h1 className="brand-title">
              <span className="brand-fjell">Fjell</span>{' '}
              <span className="brand-client-api">Client API</span>
            </h1>
            <p className="brand-tagline">
              HTTP client library for modern applications
            </p>
          </div>

          <div className="header-actions">
            <a
              href="https://github.com/getfjell/client-api"
              className="header-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href={`https://www.npmjs.com/package/@fjell/client-api/v/${version}`}
              className="version-badge"
              target="_blank"
              rel="noopener noreferrer"
            >
              v{version}
            </a>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <nav className="nav-content">
            <div className="nav-sections">
              {documentSections.map((section) => (
                <button
                  key={section.id}
                  className={`nav-item ${currentSection === section.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentSection(section.id)
                    setSidebarOpen(false)
                  }}
                >
                  <div className="nav-item-content">
                    <div className="nav-item-title">{section.title}</div>
                    <div className="nav-item-subtitle">{section.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
            <img
              src="/client-api/fjell-icon.svg"
              alt="Fjell"
              className="fjell-logo"
            />
          </nav>
        </aside>

        <main className="main">
          <div className="content-container">
            {loading ? (
              <div className="loading">
                <div className="loading-animation">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
                <div className="loading-text">Loading Client API Documentation</div>
              </div>
            ) : (
              <div className="content-wrapper">
                <div className="content-header">
                  <div className="breadcrumb">
                    <span className="breadcrumb-home">Fjell Client API</span>
                    <span className="breadcrumb-separator">•</span>
                    <span className="breadcrumb-current">
                      {documentSections.find(s => s.id === currentSection)?.title}
                    </span>
                  </div>
                  <div className="section-header">
                    <h1 className="content-title">
                      {documentSections.find(s => s.id === currentSection)?.title}
                    </h1>
                    <p className="content-subtitle">
                      {documentSections.find(s => s.id === currentSection)?.subtitle}
                    </p>
                  </div>
                </div>

                <div className="content">
                  {currentSection === 'examples' ? (
                    <div className="examples-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !props.inline && match ? (
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            )
                          },
                          h1({ children }) {
                            return <h1 className="content-h1">{children}</h1>
                          },
                          h2({ children }) {
                            return <h2 className="content-h2">{children}</h2>
                          },
                          h3({ children }) {
                            return <h3 className="content-h3">{children}</h3>
                          }
                        }}
                      >
                        {currentContent}
                      </ReactMarkdown>

                      <div className="examples-grid">
                        <div className="example-card">
                          <h3>Simple Example</h3>
                          <p>Basic CRUD operations with HTTP client patterns.</p>
                          <details>
                            <summary>View Code</summary>
                            <div className="example-code-block">
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language="bash"
                                PreTag="div"
                              >
                                npx tsx examples/simple-example.ts
                              </SyntaxHighlighter>
                            </div>
                          </details>
                        </div>

                        <div className="example-card">
                          <h3>Multi-Level Keys</h3>
                          <p>Complex hierarchical data models with nested relationships.</p>
                          <details>
                            <summary>View Code</summary>
                            <div className="example-code-block">
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language="bash"
                                PreTag="div"
                              >
                                npx tsx examples/multi-level-keys.ts
                              </SyntaxHighlighter>
                            </div>
                          </details>
                        </div>

                        <div className="example-card">
                          <h3>Enterprise Example</h3>
                          <p>Complete business application with e-commerce workflows.</p>
                          <details>
                            <summary>View Code</summary>
                            <div className="example-code-block">
                              <SyntaxHighlighter
                                style={oneLight as { [key: string]: React.CSSProperties }}
                                language="bash"
                                PreTag="div"
                              >
                                npx tsx examples/enterprise-example.ts
                              </SyntaxHighlighter>
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !props.inline && match ? (
                            <SyntaxHighlighter
                              style={oneLight as { [key: string]: React.CSSProperties }}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        },
                        h1({ children }) {
                          return <h1 className="content-h1">{children}</h1>
                        },
                        h2({ children }) {
                          return <h2 className="content-h2">{children}</h2>
                        },
                        h3({ children }) {
                          return <h3 className="content-h3">{children}</h3>
                        }
                      }}
                    >
                      {currentContent}
                    </ReactMarkdown>
                  )}
                </div>

                <div className="content-navigation">
                  {documentSections.map((section) => {
                    if (section.id === currentSection) return null
                    return (
                      <button
                        key={section.id}
                        className="nav-suggestion"
                        onClick={() => setCurrentSection(section.id)}
                      >
                        <span className="nav-suggestion-label">Next</span>
                        <span className="nav-suggestion-title">{section.title}</span>
                      </button>
                    )
                  }).filter(Boolean).slice(0, 1)}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <p className="footer-text">
              Crafted with intention for the Fjell ecosystem
            </p>
            <p className="footer-license">
              Licensed under Apache-2.0 &nbsp;•&nbsp; 2024
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
