package com.kawaii.doodle.di;

import com.kawaii.doodle.data.repository.ProfileRepositoryImpl;
import com.kawaii.doodle.domain.repository.ProfileRepository;
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
public final class RepositoryModule_ProvideProfileRepoFactory implements Factory<ProfileRepository> {
  private final Provider<ProfileRepositoryImpl> implProvider;

  public RepositoryModule_ProvideProfileRepoFactory(Provider<ProfileRepositoryImpl> implProvider) {
    this.implProvider = implProvider;
  }

  @Override
  public ProfileRepository get() {
    return provideProfileRepo(implProvider.get());
  }

  public static RepositoryModule_ProvideProfileRepoFactory create(
      javax.inject.Provider<ProfileRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideProfileRepoFactory(Providers.asDaggerProvider(implProvider));
  }

  public static RepositoryModule_ProvideProfileRepoFactory create(
      Provider<ProfileRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideProfileRepoFactory(implProvider);
  }

  public static ProfileRepository provideProfileRepo(ProfileRepositoryImpl impl) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideProfileRepo(impl));
  }
}
