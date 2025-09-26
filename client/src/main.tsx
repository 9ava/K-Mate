import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { I18nextProvider } from 'react-i18next'
import App from './App.tsx'

// Load dev admin utilities in development
if (import.meta.env.DEV) {
	import('./utils/dev-admin')
}

// Import and wait for i18n initialization
import('./lib/i18n/i18n').then(({ default: i18n }) => {
	// Wait for i18n to be ready before rendering
	if (i18n.isInitialized) {
		renderApp(i18n)
	} else {
		i18n.on('initialized', () => renderApp(i18n))
	}
})

function renderApp(i18n: any) {
	createRoot(document.getElementById('root')!).render(
		<StrictMode>
			<I18nextProvider i18n={i18n}>
				<App />
			</I18nextProvider>
		</StrictMode>
	)
}


