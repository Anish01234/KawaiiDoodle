package com.kawaii.doodle.di;

import com.kawaii.doodle.data.repository.DoodleRepositoryImpl;
import com.kawaii.doodle.domain.repository.DoodleRepository;
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
public final class RepositoryModule_ProvideDoodleRepoFactory implements Factory<DoodleRepository> {
  private final Provider<DoodleRepositoryImpl> implProvider;

  public RepositoryModule_ProvideDoodleRepoFactory(Provider<DoodleRepositoryImpl> implProvider) {
    this.implProvider = implProvider;
  }

  @Override
  public DoodleRepository get() {
    return provideDoodleRepo(implProvider.get());
  }

  public static RepositoryModule_ProvideDoodleRepoFactory create(
      javax.inject.Provider<DoodleRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideDoodleRepoFactory(Providers.asDaggerProvider(implProvider));
  }

  public static RepositoryModule_ProvideDoodleRepoFactory create(
      Provider<DoodleRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideDoodleRepoFactory(implProvider);
  }

  public static DoodleRepository provideDoodleRepo(DoodleRepositoryImpl impl) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideDoodleRepo(impl));
  }
}
