package ph.ireside.mobile

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.view.View
import android.webkit.CookieManager
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.core.view.isVisible
import ph.ireside.mobile.databinding.ActivityMainBinding
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var backPressedTime: Long = 0

    // File Chooser & Camera variables
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoUri: Uri? = null
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>

    // Network callback
    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var isCurrentlyOffline = false

    private val targetUrl: String
        get() = BuildConfig.TARGET_URL.ifEmpty { "https://i-reside-capstone.vercel.app/mobile" }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initFileChooserLauncher()
        initSwipeRefresh()
        initOfflineView()
        setupWebView()
        setupBackNavigation()
        setupNetworkMonitoring()

        if (savedInstanceState != null) {
            binding.webView.restoreState(savedInstanceState)
        } else {
            loadInitialPage()
        }
    }

    private fun initFileChooserLauncher() {
        fileChooserLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val callback = filePathCallback ?: return@registerForActivityResult
            var results: Array<Uri>? = null

            if (result.resultCode == RESULT_OK) {
                val data = result.data
                if (data != null && data.data != null) {
                    // Chosen from file picker / gallery
                    results = arrayOf(data.data!!)
                } else if (cameraPhotoUri != null) {
                    // Captured via camera
                    val file = getCameraPhotoFile()
                    if (file != null && file.exists() && file.length() > 0) {
                        results = arrayOf(cameraPhotoUri!!)
                    }
                }
            }

            callback.onReceiveValue(results)
            filePathCallback = null
            cameraPhotoUri = null
        }
    }

    private fun initSwipeRefresh() {
        binding.swipeRefreshLayout.setColorSchemeResources(
            R.color.sage_green,
            R.color.primary
        )
        binding.swipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.surface_dark)

        binding.swipeRefreshLayout.setOnRefreshListener {
            if (isNetworkAvailable()) {
                binding.webView.reload()
            } else {
                binding.swipeRefreshLayout.isRefreshing = false
                showOfflineView()
            }
        }

        // Only allow swipe-to-refresh when webView is at the top
        binding.webView.viewTreeObserver.addOnScrollChangedListener {
            binding.swipeRefreshLayout.isEnabled = (binding.webView.scrollY == 0)
        }
    }

    private fun initOfflineView() {
        binding.btnRetry.setOnClickListener {
            retryConnection()
        }
    }

    private fun retryConnection() {
        binding.retrySpinner.isVisible = true
        binding.btnRetry.isEnabled = false

        Handler(Looper.getMainLooper()).postDelayed({
            if (isNetworkAvailable()) {
                hideOfflineView()
                binding.webView.reload()
            } else {
                Toast.makeText(this, R.string.offline_title, Toast.LENGTH_SHORT).show()
            }
            binding.retrySpinner.isVisible = false
            binding.btnRetry.isEnabled = true
        }, 600)
    }

    private fun showOfflineView() {
        isCurrentlyOffline = true
        binding.swipeRefreshLayout.isVisible = false
        binding.progressBar.isVisible = false
        binding.offlineContainer.isVisible = true
    }

    private fun hideOfflineView() {
        isCurrentlyOffline = false
        binding.offlineContainer.isVisible = false
        binding.swipeRefreshLayout.isVisible = true
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webView = binding.webView
        val settings = webView.settings

        // Enable JavaScript and Web Application features
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false

        // Cache & Performance
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

        // Custom User Agent string identifying mobile app
        val defaultUserAgent = settings.userAgentString
        settings.userAgentString = "$defaultUserAgent iResideMobile/1.0.0 (Android Native)"

        // Cookies setup (crucial for Supabase auth cookies and sessions)
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        // WebChromeClient: file picker, progress indicator
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                if (newProgress < 100 && !isCurrentlyOffline) {
                    binding.progressBar.isVisible = true
                    binding.progressBar.progress = newProgress
                } else {
                    binding.progressBar.isVisible = false
                    binding.swipeRefreshLayout.isRefreshing = false
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                return launchFileChooser(fileChooserParams)
            }
        }

        // WebViewClient: link routing, loading states, error handling
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false

                // Handle system schemes: tel, mailto, sms, geo
                if (url.startsWith("tel:") || url.startsWith("mailto:") ||
                    url.startsWith("sms:") || url.startsWith("geo:")
                ) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "No app available to handle this action.", Toast.LENGTH_SHORT).show()
                    }
                    return true
                }

                // If navigation stays within app domain or relative path, load inside WebView
                val uri = Uri.parse(url)
                val targetHost = Uri.parse(targetUrl).host
                if (uri.host == null || uri.host.equals(targetHost, ignoreCase = true) ||
                    url.contains("i-reside-capstone.vercel.app")
                ) {
                    return false
                }

                // External URLs open in external system browser
                try {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    startActivity(intent)
                    return true
                } catch (e: Exception) {
                    return false
                }
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                if (!isCurrentlyOffline) {
                    binding.progressBar.isVisible = true
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.progressBar.isVisible = false
                binding.swipeRefreshLayout.isRefreshing = false
                if (!isCurrentlyOffline) {
                    hideOfflineView()
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    // Main page failed to load
                    showOfflineView()
                }
            }
        }

        // Native Download Listener for PDFs, Invoices, Receipts
        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            downloadFile(url, userAgent, contentDisposition, mimeType)
        }
    }

    private fun launchFileChooser(fileChooserParams: WebChromeClient.FileChooserParams?): Boolean {
        try {
            // 1. Create Camera Intent
            var cameraIntent: Intent? = null
            val photoFile = createImageFile()
            if (photoFile != null) {
                cameraPhotoUri = FileProvider.getUriForFile(
                    this,
                    "ph.ireside.mobile.fileprovider",
                    photoFile
                )
                cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                    putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri)
                    addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                }
            }

            // 2. Create Gallery / Document picker Intent
            val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                val acceptTypes = fileChooserParams?.acceptTypes
                if (!acceptTypes.isNullOrEmpty() && acceptTypes[0].isNotBlank()) {
                    type = acceptTypes[0]
                    if (acceptTypes.size > 1) {
                        putExtra(Intent.EXTRA_MIME_TYPES, acceptTypes)
                    }
                } else {
                    type = "*/*"
                }
            }

            // 3. Combine into chooser
            val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                putExtra(Intent.EXTRA_INTENT, contentIntent)
                putExtra(Intent.EXTRA_TITLE, "Select Document or Capture Photo")
                if (cameraIntent != null) {
                    putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(cameraIntent))
                }
            }

            fileChooserLauncher.launch(chooserIntent)
            return true
        } catch (e: Exception) {
            filePathCallback?.onReceiveValue(null)
            filePathCallback = null
            return false
        }
    }

    private var currentPhotoPath: String? = null

    @Throws(IOException::class)
    private fun createImageFile(): File? {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "JPEG_${timeStamp}_"
        val storageDir = externalCacheDir ?: cacheDir
        val image = File.createTempFile(imageFileName, ".jpg", storageDir)
        currentPhotoPath = image.absolutePath
        return image
    }

    private fun getCameraPhotoFile(): File? {
        return currentPhotoPath?.let { File(it) }
    }

    private fun downloadFile(
        url: String,
        userAgent: String,
        contentDisposition: String,
        mimeType: String
    ) {
        try {
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                addRequestHeader("User-Agent", userAgent)
                addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url))
                setDescription("Downloading iReside document...")
                val filename = URLUtil.guessFileName(url, contentDisposition, mimeType)
                setTitle(filename)
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
            }

            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            Toast.makeText(this, R.string.downloading_file, Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, R.string.download_failed, Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (isCurrentlyOffline) {
                    if (binding.webView.canGoBack()) {
                        hideOfflineView()
                        binding.webView.goBack()
                        return
                    }
                }

                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    if (backPressedTime + 2000 > System.currentTimeMillis()) {
                        finish()
                    } else {
                        Toast.makeText(
                            this@MainActivity,
                            R.string.press_back_again_to_exit,
                            Toast.LENGTH_SHORT
                        ).show()
                        backPressedTime = System.currentTimeMillis()
                    }
                }
            }
        })
    }

    private fun setupNetworkMonitoring() {
        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                runOnUiThread {
                    if (isCurrentlyOffline) {
                        retryConnection()
                    }
                }
            }

            override fun onLost(network: Network) {
                runOnUiThread {
                    if (!isNetworkAvailable()) {
                        showOfflineView()
                    }
                }
            }
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager?.registerNetworkCallback(request, networkCallback!!)
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun loadInitialPage() {
        if (isNetworkAvailable()) {
            hideOfflineView()
            binding.webView.loadUrl(targetUrl)
        } else {
            showOfflineView()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        binding.webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        binding.webView.onResume()
    }

    override fun onPause() {
        binding.webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        networkCallback?.let { connectivityManager?.unregisterNetworkCallback(it) }
        binding.webView.destroy()
        super.onDestroy()
    }
}
