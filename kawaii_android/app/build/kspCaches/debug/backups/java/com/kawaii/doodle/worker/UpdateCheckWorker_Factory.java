package com.kawaii.doodle.worker;

import android.content.Context;
import androidx.work.WorkerParameters;
import com.kawaii.doodle.data.remote.GithubApiService;
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
public final class UpdateCheckWorker_Factory {
  private final Provider<GithubApiService> githubApiProvider;

  public UpdateCheckWorker_Factory(Provider<GithubApiService> githubApiProvider) {
    this.githubApiProvider = githubApiProvider;
  }

  public UpdateCheckWorker get(Context ctx, WorkerParameters params) {
    return newInstance(ctx, params, githubApiProvider.get());
  }

  public static UpdateCheckWorker_Factory create(
      javax.inject.Provider<GithubApiService> githubApiProvider) {
    return new UpdateCheckWorker_Factory(Providers.asDaggerProvider(githubApiProvider));
  }

  public static UpdateCheckWorker_Factory create(Provider<GithubApiService> githubApiProvider) {
    return new UpdateCheckWorker_Factory(githubApiProvider);
  }

  public static UpdateCheckWorker newInstance(Context ctx, WorkerParameters params,
      GithubApiService githubApi) {
    return new UpdateCheckWorker(ctx, params, githubApi);
  }
}
