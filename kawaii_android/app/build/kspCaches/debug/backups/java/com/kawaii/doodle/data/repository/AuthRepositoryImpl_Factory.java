package com.kawaii.doodle.data.repository;

import androidx.datastore.core.DataStore;
import androidx.datastore.preferences.core.Preferences;
import com.kawaii.doodle.data.remote.SupabaseAuthService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class AuthRepositoryImpl_Factory implements Factory<AuthRepositoryImpl> {
  private final Provider<SupabaseAuthService> authApiProvider;

  private final Provider<DataStore<Preferences>> dataStoreProvider;

  public AuthRepositoryImpl_Factory(Provider<SupabaseAuthService> authApiProvider,
      Provider<DataStore<Preferences>> dataStoreProvider) {
    this.authApiProvider = authApiProvider;
    this.dataStoreProvider = dataStoreProvider;
  }

  @Override
  public AuthRepositoryImpl get() {
    return newInstance(authApiProvider.get(), dataStoreProvider.get());
  }

  public static AuthRepositoryImpl_Factory create(
      javax.inject.Provider<SupabaseAuthService> authApiProvider,
      javax.inject.Provider<DataStore<Preferences>> dataStoreProvider) {
    return new AuthRepositoryImpl_Factory(Providers.asDaggerProvider(authApiProvider), Providers.asDaggerProvider(dataStoreProvider));
  }

  public static AuthRepositoryImpl_Factory create(Provider<SupabaseAuthService> authApiProvider,
      Provider<DataStore<Preferences>> dataStoreProvider) {
    return new AuthRepositoryImpl_Factory(authApiProvider, dataStoreProvider);
  }

  public static AuthRepositoryImpl newInstance(SupabaseAuthService authApi,
      DataStore<Preferences> dataStore) {
    return new AuthRepositoryImpl(authApi, dataStore);
  }
}
