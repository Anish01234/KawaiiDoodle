package com.kawaii.doodle.di;

import com.kawaii.doodle.data.repository.DraftRepositoryImpl;
import com.kawaii.doodle.domain.repository.DraftRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
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
public final class RepositoryModule_ProvideDraftRepoFactory implements Factory<DraftRepository> {
  private final Provider<DraftRepositoryImpl> implProvider;

  public RepositoryModule_ProvideDraftRepoFactory(Provider<DraftRepositoryImpl> implProvider) {
    this.implProvider = implProvider;
  }

  @Override
  public DraftRepository get() {
    return provideDraftRepo(implProvider.get());
  }

  public static RepositoryModule_ProvideDraftRepoFactory create(
      javax.inject.Provider<DraftRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideDraftRepoFactory(Providers.asDaggerProvider(implProvider));
  }

  public static RepositoryModule_ProvideDraftRepoFactory create(
      Provider<DraftRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideDraftRepoFactory(implProvider);
  }

  public static DraftRepository provideDraftRepo(DraftRepositoryImpl impl) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideDraftRepo(impl));
  }
}
