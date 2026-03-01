package com.kawaii.doodle.worker;

import android.content.Context;
import androidx.work.WorkerParameters;
import com.kawaii.doodle.domain.repository.AuthRepository;
import com.kawaii.doodle.domain.repository.DraftRepository;
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
public final class DraftSyncWorker_Factory {
  private final Provider<AuthRepository> authRepoProvider;

  private final Provider<DraftRepository> draftRepoProvider;

  public DraftSyncWorker_Factory(Provider<AuthRepository> authRepoProvider,
      Provider<DraftRepository> draftRepoProvider) {
    this.authRepoProvider = authRepoProvider;
    this.draftRepoProvider = draftRepoProvider;
  }

  public DraftSyncWorker get(Context ctx, WorkerParameters params) {
    return newInstance(ctx, params, authRepoProvider.get(), draftRepoProvider.get());
  }

  public static DraftSyncWorker_Factory create(
      javax.inject.Provider<AuthRepository> authRepoProvider,
      javax.inject.Provider<DraftRepository> draftRepoProvider) {
    return new DraftSyncWorker_Factory(Providers.asDaggerProvider(authRepoProvider), Providers.asDaggerProvider(draftRepoProvider));
  }

  public static DraftSyncWorker_Factory create(Provider<AuthRepository> authRepoProvider,
      Provider<DraftRepository> draftRepoProvider) {
    return new DraftSyncWorker_Factory(authRepoProvider, draftRepoProvider);
  }

  public static DraftSyncWorker newInstance(Context ctx, WorkerParameters params,
      AuthRepository authRepo, DraftRepository draftRepo) {
    return new DraftSyncWorker(ctx, params, authRepo, draftRepo);
  }
}
