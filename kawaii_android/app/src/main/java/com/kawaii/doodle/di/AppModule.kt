package com.kawaii.doodle.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.kawaii.doodle.BuildConfig
import com.kawaii.doodle.data.local.AppDatabase
import com.kawaii.doodle.data.local.dao.DoodleDao
import com.kawaii.doodle.data.local.dao.DraftDao
import com.kawaii.doodle.data.local.dao.FriendDao
import com.kawaii.doodle.data.local.dao.ProfileDao
import com.kawaii.doodle.data.remote.*
import com.kawaii.doodle.data.repository.*
import com.kawaii.doodle.domain.model.User
import com.kawaii.doodle.domain.repository.*
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Named
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "kawaii_prefs")

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): AppDatabase =
        Room.databaseBuilder(ctx, AppDatabase::class.java, "kawaii_db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun provideDoodleDao(db: AppDatabase): DoodleDao = db.doodleDao()
    @Provides fun provideDraftDao(db: AppDatabase): DraftDao = db.draftDao()
    @Provides fun provideFriendDao(db: AppDatabase): FriendDao = db.friendDao()
    @Provides fun provideProfileDao(db: AppDatabase): ProfileDao = db.profileDao()

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext ctx: Context): DataStore<Preferences> = ctx.dataStore
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    @Named("supabase")
    fun provideOkHttpClient(dataStore: DataStore<Preferences>): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                else HttpLoggingInterceptor.Level.NONE
            })
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("apikey", BuildConfig.SUPABASE_KEY)
                    .addHeader("Content-Type", "application/json")
                // Read token synchronously (blocking, but this is I/O thread)
                val token = runBlocking {
                    dataStore.data.first()[PrefsKeys.ACCESS_TOKEN]
                }
                if (token != null) request.addHeader("Authorization", "Bearer $token")
                else request.addHeader("Authorization", "Bearer ${BuildConfig.SUPABASE_KEY}")
                chain.proceed(request.build())
            }
            .build()
    }

    @Provides
    @Singleton
    @Named("github")
    fun provideGithubOkHttpClient(): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor { chain ->
                chain.proceed(
                    chain.request().newBuilder()
                        .addHeader("Accept", "application/vnd.github+json")
                        .build()
                )
            }
            .build()

    @Provides
    @Singleton
    fun provideSupabaseApiService(@Named("supabase") client: OkHttpClient): SupabaseApiService =
        Retrofit.Builder()
            .baseUrl(BuildConfig.SUPABASE_URL + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SupabaseApiService::class.java)

    @Provides
    @Singleton
    fun provideSupabaseAuthService(@Named("supabase") client: OkHttpClient): SupabaseAuthService =
        Retrofit.Builder()
            .baseUrl(BuildConfig.SUPABASE_URL + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SupabaseAuthService::class.java)

    @Provides
    @Singleton
    fun provideSupabaseFunctionService(@Named("supabase") client: OkHttpClient): SupabaseFunctionService =
        Retrofit.Builder()
            .baseUrl(BuildConfig.SUPABASE_URL + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SupabaseFunctionService::class.java)

    @Provides
    @Singleton
    fun provideGithubApiService(@Named("github") client: OkHttpClient): GithubApiService =
        Retrofit.Builder()
            .baseUrl("https://api.github.com/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GithubApiService::class.java)

    @Provides
    @Singleton
    fun provideGithubRawService(@Named("github") client: OkHttpClient): GithubRawService =
        Retrofit.Builder()
            .baseUrl("https://raw.githubusercontent.com/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GithubRawService::class.java)
}

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides @Singleton
    fun provideAuthRepo(impl: AuthRepositoryImpl): AuthRepository = impl

    @Provides @Singleton
    fun provideProfileRepo(impl: ProfileRepositoryImpl): ProfileRepository = impl

    @Provides @Singleton
    fun provideDoodleRepo(impl: DoodleRepositoryImpl): DoodleRepository = impl

    @Provides @Singleton
    fun provideDraftRepo(impl: DraftRepositoryImpl): DraftRepository = impl

    @Provides @Singleton
    fun provideFriendRepo(impl: FriendRepositoryImpl): FriendRepository = impl
}
