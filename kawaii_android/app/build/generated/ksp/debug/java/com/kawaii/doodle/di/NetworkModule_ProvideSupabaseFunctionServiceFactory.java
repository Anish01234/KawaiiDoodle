package com.kawaii.doodle.di;

import com.kawaii.doodle.data.remote.SupabaseFunctionService;
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
public final class NetworkModule_ProvideSupabaseFunctionServiceFactory implements Factory<SupabaseFunctionService> {
  private final Provider<OkHttpClient> clientProvider;

  public NetworkModule_ProvideSupabaseFunctionServiceFactory(
      Provider<OkHttpClient> clientProvider) {
    this.clientProvider = clientProvider;
  }

  @Override
  public SupabaseFunctionService get() {
    return provideSupabaseFunctionService(clientProvider.get());
  }

  public static NetworkModule_ProvideSupabaseFunctionServiceFactory create(
      javax.inject.Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideSupabaseFunctionServiceFactory(Providers.asDaggerProvider(clientProvider));
  }

  public static NetworkModule_ProvideSupabaseFunctionServiceFactory create(
      Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideSupabaseFunctionServiceFactory(clientProvider);
  }

  public static SupabaseFunctionService provideSupabaseFunctionService(OkHttpClient client) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideSupabaseFunctionService(client));
  }
}
