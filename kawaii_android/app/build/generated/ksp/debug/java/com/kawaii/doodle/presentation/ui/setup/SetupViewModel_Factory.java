package com.kawaii.doodle.presentation.ui.setup;

import com.kawaii.doodle.domain.repository.AuthRepository;
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
public final class SetupViewModel_Factory implements Factory<SetupViewModel> {
  private final Provider<AuthRepository> authRepoProvider;

  private final Provider<ProfileRepository> profileRepoProvider;

  public SetupViewModel_Factory(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider) {
    this.authRepoProvider = authRepoProvider;
    this.profileRepoProvider = profileRepoProvider;
  }

  @Override
  public SetupViewModel get() {
    return newInstance(authRepoProvider.get(), profileRepoProvider.get());
  }

  public static SetupViewModel_Factory create(
      javax.inject.Provider<AuthRepository> authRepoProvider,
      javax.inject.Provider<ProfileRepository> profileRepoProvider) {
    return new SetupViewModel_Factory(Providers.asDaggerProvider(authRepoProvider), Providers.asDaggerProvider(profileRepoProvider));
  }

  public static SetupViewModel_Factory create(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider) {
    return new SetupViewModel_Factory(authRepoProvider, profileRepoProvider);
  }

  public static SetupViewModel newInstance(AuthRepository authRepo, ProfileRepository profileRepo) {
    return new SetupViewModel(authRepo, profileRepo);
  }
}
