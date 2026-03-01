package com.kawaii.doodle.di;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
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
public final class NetworkModule_ProvideGithubOkHttpClientFactory implements Factory<OkHttpClient> {
  @Override
  public OkHttpClient get() {
    return provideGithubOkHttpClient();
  }

  public static NetworkModule_ProvideGithubOkHttpClientFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static OkHttpClient provideGithubOkHttpClient() {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideGithubOkHttpClient());
  }

  private static final class InstanceHolder {
    static final NetworkModule_ProvideGithubOkHttpClientFactory INSTANCE = new NetworkModule_ProvideGithubOkHttpClientFactory();
  }
}
