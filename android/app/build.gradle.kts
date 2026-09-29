plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "ph.ireside.mobile"
    compileSdk = 35

    defaultConfig {
        applicationId = "ph.ireside.mobile"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        val targetUrl = project.findProperty("targetUrl") as? String ?: "https://i-reside-capstone.vercel.app/mobile"
        buildConfigField("String", "TARGET_URL", "\"$targetUrl\"")
    }

    signingConfigs {
        create("release") {
            storeFile = file("ireside-release.jks")
            storePassword = "ireside2026"
            keyAlias = "ireside"
            keyPassword = "ireside2026"
            enableV1Signing = true
            enableV2Signing = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
        viewBinding = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.swiperefreshlayout)
    implementation(libs.androidx.webkit)
}
