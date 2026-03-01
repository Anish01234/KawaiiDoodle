package com.kawaii.doodle.di;

import com.kawaii.doodle.data.remote.SupabaseAuthService;
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
public final class NetworkModule_ProvideSupabaseAuthServiceFactory implements Factory<SupabaseAuthService> {
  private final Provider<OkHttpClient> clientProvider;

  public NetworkModule_ProvideSupabaseAuthServiceFactory(Provider<OkHttpClient> clientProvider) {
    this.clientProvider = clientProvider;
  }

  @Override
  public SupabaseAuthService get() {
    return provideSupabaseAuthService(clientProvider.get());
  }

  public static NetworkModule_ProvideSupabaseAuthServiceFactory create(
      javax.inject.Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideSupabaseAuthServiceFactory(Providers.asDaggerProvider(clientProvider));
  }

  public static NetworkModule_ProvideSupabaseAuthServiceFactory create(
      Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideSupabaseAuthServiceFactory(clientProvider);
  }

  public static SupabaseAuthService provideSupabaseAuthService(OkHttpClient client) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideSupabaseAuthService(client));
  }
}
