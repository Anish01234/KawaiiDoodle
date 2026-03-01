package com.kawaii.doodle.di;

import androidx.datastore.core.DataStore;
import androidx.datastore.preferences.core.Preferences;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import okhttp3.OkHttpClient;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("javax.inject.Named")
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
public final class NetworkModule_ProvideOkHttpClientFactory implements Factory<OkHttpClient> {
  private final Provider<DataStore<Preferences>> dataStoreProvider;

  public NetworkModule_ProvideOkHttpClientFactory(
      Provider<DataStore<Preferences>> dataStoreProvider) {
    this.dataStoreProvider = dataStoreProvider;
  }

  @Override
  public OkHttpClient get() {
    return provideOkHttpClient(dataStoreProvider.get());
  }

  public static NetworkModule_ProvideOkHttpClientFactory create(
      javax.inject.Provider<DataStore<Preferences>> dataStoreProvider) {
    return new NetworkModule_ProvideOkHttpClientFactory(Providers.asDaggerProvider(dataStoreProvider));
  }

  public static NetworkModule_ProvideOkHttpClientFactory create(
      Provider<DataStore<Preferences>> dataStoreProvider) {
    return new NetworkModule_ProvideOkHttpClientFactory(dataStoreProvider);
  }

  public static OkHttpClient provideOkHttpClient(DataStore<Preferences> dataStore) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideOkHttpClient(dataStore));
  }
}
