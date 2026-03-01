package com.kawaii.doodle.di;

import com.kawaii.doodle.data.remote.GithubRawService;
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
public final class NetworkModule_ProvideGithubRawServiceFactory implements Factory<GithubRawService> {
  private final Provider<OkHttpClient> clientProvider;

  public NetworkModule_ProvideGithubRawServiceFactory(Provider<OkHttpClient> clientProvider) {
    this.clientProvider = clientProvider;
  }

  @Override
  public GithubRawService get() {
    return provideGithubRawService(clientProvider.get());
  }

  public static NetworkModule_ProvideGithubRawServiceFactory create(
      javax.inject.Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideGithubRawServiceFactory(Providers.asDaggerProvider(clientProvider));
  }

  public static NetworkModule_ProvideGithubRawServiceFactory create(
      Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideGithubRawServiceFactory(clientProvider);
  }

  public static GithubRawService provideGithubRawService(OkHttpClient client) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideGithubRawService(client));
  }
}
