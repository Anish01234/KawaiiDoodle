package com.kawaii.doodle.di;

import com.kawaii.doodle.data.remote.GithubApiService;
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
public final class NetworkModule_ProvideGithubApiServiceFactory implements Factory<GithubApiService> {
  private final Provider<OkHttpClient> clientProvider;

  public NetworkModule_ProvideGithubApiServiceFactory(Provider<OkHttpClient> clientProvider) {
    this.clientProvider = clientProvider;
  }

  @Override
  public GithubApiService get() {
    return provideGithubApiService(clientProvider.get());
  }

  public static NetworkModule_ProvideGithubApiServiceFactory create(
      javax.inject.Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideGithubApiServiceFactory(Providers.asDaggerProvider(clientProvider));
  }

  public static NetworkModule_ProvideGithubApiServiceFactory create(
      Provider<OkHttpClient> clientProvider) {
    return new NetworkModule_ProvideGithubApiServiceFactory(clientProvider);
  }

  public static GithubApiService provideGithubApiService(OkHttpClient client) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideGithubApiService(client));
  }
}
