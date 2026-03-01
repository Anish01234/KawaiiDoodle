package com.kawaii.doodle.worker;

import android.content.Context;
import androidx.work.WorkerParameters;
import com.kawaii.doodle.data.remote.GithubRawService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
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
public final class CriticalHealthWorker_Factory {
  private final Provider<GithubRawService> githubRawApiProvider;

  public CriticalHealthWorker_Factory(Provider<GithubRawService> githubRawApiProvider) {
    this.githubRawApiProvider = githubRawApiProvider;
  }

  public CriticalHealthWorker get(Context ctx, WorkerParameters params) {
    return newInstance(ctx, params, githubRawApiProvider.get());
  }

  public static CriticalHealthWorker_Factory create(
      javax.inject.Provider<GithubRawService> githubRawApiProvider) {
    return new CriticalHealthWorker_Factory(Providers.asDaggerProvider(githubRawApiProvider));
  }

  public static CriticalHealthWorker_Factory create(
      Provider<GithubRawService> githubRawApiProvider) {
    return new CriticalHealthWorker_Factory(githubRawApiProvider);
  }

  public static CriticalHealthWorker newInstance(Context ctx, WorkerParameters params,
      GithubRawService githubRawApi) {
    return new CriticalHealthWorker(ctx, params, githubRawApi);
  }
}
