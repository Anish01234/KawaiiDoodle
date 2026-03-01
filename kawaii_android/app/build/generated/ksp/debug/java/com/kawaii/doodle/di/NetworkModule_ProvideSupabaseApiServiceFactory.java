package com.kawaii.doodle.di;

import com.kawaii.doodle.data.remote.SupabaseApiService;
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
public final class NetworkModule_ProvideSupabaseApiServiceFactory implements Factory<SupabaseApiService> {
  private final Provider<OkHttpClient> clientProvider;

  public NetworkModule_ProvideSupabaseApiServiceFactory(Provider<OkHttpClient> clientProvider) {
    this.clientProvider = clientProvider;
  }

  @Override
  public SupabaseApiService get() {
    return provideSupabaseApiService(clientProvider.get());
  }

  public static NetworkModule_ProvideSupabaseApiServiceFactory create(
      javax.inject.Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideSupabaseApiServiceFactory(Providers.asDaggerProvider(clientProvider));
  }

  public static NetworkModule_ProvideSupabaseApiServiceFactory create(
      Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideSupabaseApiServiceFactory(clientProvider);
  }

  public static SupabaseApiService provideSupabaseApiService(OkHttpClient client) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideSupabaseApiService(client));
  }
}
