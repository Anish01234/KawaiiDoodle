package com.kawaii.doodle.presentation.ui.history;

import android.content.Context;
import com.kawaii.doodle.domain.repository.AuthRepository;
import com.kawaii.doodle.domain.repository.DoodleRepository;
import com.kawaii.doodle.domain.repository.DraftRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class HistoryViewModel_Factory implements Factory<HistoryViewModel> {
  private final Provider<AuthRepository> authRepoProvider;

  private final Provider<DoodleRepository> doodleRepoProvider;

  private final Provider<DraftRepository> draftRepoProvider;

  private final Provider<Context> contextProvider;

  public HistoryViewModel_Factory(Provider<AuthRepository> authRepoProvider,
      Provider<DoodleRepository> doodleRepoProvider, Provider<DraftRepository> draftRepoProvider,
      Provider<Context> contextProvider) {
    this.authRepoProvider = authRepoProvider;
    this.doodleRepoProvider = doodleRepoProvider;
    this.draftRepoProvider = draftRepoProvider;
    this.contextProvider = contextProvider;
  }

  @Override
  public HistoryViewModel get() {
    return newInstance(authRepoProvider.get(), doodleRepoProvider.get(), draftRepoProvider.get(), contextProvider.get());
  }

  public static HistoryViewModel_Factory create(
      javax.inject.Provider<AuthRepository> authRepoProvider,
      javax.inject.Provider<DoodleRepository> doodleRepoProvider,
      javax.inject.Provider<DraftRepository> draftRepoProvider,
      javax.inject.Provider<Context> contextProvider) {
    return new HistoryViewModel_Factory(Providers.asDaggerProvider(authRepoProvider), Providers.asDaggerProvider(doodleRepoProvider), Providers.asDaggerProvider(draftRepoProvider), Providers.asDaggerProvider(contextProvider));
  }

  public static HistoryViewModel_Factory create(Provider<AuthRepository> authRepoProvider,
      Provider<DoodleRepository> doodleRepoProvider, Provider<DraftRepository> draftRepoProvider,
      Provider<Context> contextProvider) {
    return new HistoryViewModel_Factory(authRepoProvider, doodleRepoProvider, draftRepoProvider, contextProvider);
  }

  public static HistoryViewModel newInstance(AuthRepository authRepo, DoodleRepository doodleRepo,
      DraftRepository draftRepo, Context context) {
    return new HistoryViewModel(authRepo, doodleRepo, draftRepo, context);
  }
}
