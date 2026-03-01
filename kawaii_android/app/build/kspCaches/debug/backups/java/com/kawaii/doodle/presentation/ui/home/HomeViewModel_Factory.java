package com.kawaii.doodle.presentation.ui.home;

import com.kawaii.doodle.domain.repository.AuthRepository;
import com.kawaii.doodle.domain.repository.DoodleRepository;
import com.kawaii.doodle.domain.repository.ProfileRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
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
public final class HomeViewModel_Factory implements Factory<HomeViewModel> {
  private final Provider<AuthRepository> authRepoProvider;

  private final Provider<ProfileRepository> profileRepoProvider;

  private final Provider<DoodleRepository> doodleRepoProvider;

  public HomeViewModel_Factory(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider,
      Provider<DoodleRepository> doodleRepoProvider) {
    this.authRepoProvider = authRepoProvider;
    this.profileRepoProvider = profileRepoProvider;
    this.doodleRepoProvider = doodleRepoProvider;
  }

  @Override
  public HomeViewModel get() {
    return newInstance(authRepoProvider.get(), profileRepoProvider.get(), doodleRepoProvider.get());
  }

  public static HomeViewModel_Factory create(javax.inject.Provider<AuthRepository> authRepoProvider,
      javax.inject.Provider<ProfileRepository> profileRepoProvider,
      javax.inject.Provider<DoodleRepository> doodleRepoProvider) {
    return new HomeViewModel_Factory(Providers.asDaggerProvider(authRepoProvider), Providers.asDaggerProvider(profileRepoProvider), Providers.asDaggerProvider(doodleRepoProvider));
  }

  public static HomeViewModel_Factory create(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider,
      Provider<DoodleRepository> doodleRepoProvider) {
    return new HomeViewModel_Factory(authRepoProvider, profileRepoProvider, doodleRepoProvider);
  }

  public static HomeViewModel newInstance(AuthRepository authRepo, ProfileRepository profileRepo,
      DoodleRepository doodleRepo) {
    return new HomeViewModel(authRepo, profileRepo, doodleRepo);
  }
}
