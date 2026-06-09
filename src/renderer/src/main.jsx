import './assets/main.css'

import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store/store'
import routes from './routes/routes'
import { checkBackendHealth } from './api/backendConfig'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const router = createHashRouter(routes)

// Call backend health check before rendering
checkBackendHealth().finally(() => {
  createRoot(document.getElementById('root')).render(
    <>
      <Provider store={store}>
        <RouterProvider router={router} />
        <ToastContainer position="top-right" autoClose={5000} newestOnTop />
      </Provider>
    </>
  )
})
