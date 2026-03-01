package com.kawaii.doodle.presentation.ui.draw;

import androidx.lifecycle.SavedStateHandle;
import com.kawaii.doodle.domain.repository.AuthRepository;
import com.kawaii.doodle.domain.repository.DoodleRepository;
import com.kawaii.doodle.domain.repository.DraftRepository;
import com.kawaii.doodle.domain.repository.FriendRepository;
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
public final class DrawViewModel_Factory implements Factory<DrawViewModel> {
  private final Provider<AuthRepository> authRepoProvider;

  private final Provider<ProfileRepository> profileRepoProvider;

  private final Provider<DoodleRepository> doodleRepoProvider;

  private final Provider<DraftRepository> draftRepoProvider;

  private final Provider<FriendRepository> friendRepoProvider;

  private final Provider<SavedStateHandle> savedStateHandleProvider;

  public DrawViewModel_Factory(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider,
      Provider<DoodleRepository> doodleRepoProvider, Provider<DraftRepository> draftRepoProvider,
      Provider<FriendRepository> friendRepoProvider,
      Provider<SavedStateHandle> savedStateHandleProvider) {
    this.authRepoProvider = authRepoProvider;
    this.profileRepoProvider = profileRepoProvider;
    this.doodleRepoProvider = doodleRepoProvider;
    this.draftRepoProvider = draftRepoProvider;
    this.friendRepoProvider = friendRepoProvider;
    this.savedStateHandleProvider = savedStateHandleProvider;
  }

  @Override
  public DrawViewModel get() {
    return newInstance(authRepoProvider.get(), profileRepoProvider.get(), doodleRepoProvider.get(), draftRepoProvider.get(), friendRepoProvider.get(), savedStateHandleProvider.get());
  }

  public static DrawViewModel_Factory create(javax.inject.Provider<AuthRepository> authRepoProvider,
      javax.inject.Provider<ProfileRepository> profileRepoProvider,
      javax.inject.Provider<DoodleRepository> doodleRepoProvider,
      javax.inject.Provider<DraftRepository> draftRepoProvider,
      javax.inject.Provider<FriendRepository> friendRepoProvider,
      javax.inject.Provider<SavedStateHandle> savedStateHandleProvider) {
    return new DrawViewModel_Factory(Providers.asDaggerProvider(authRepoProvider), Providers.asDaggerProvider(profileRepoProvider), Providers.asDaggerProvider(doodleRepoProvider), Providers.asDaggerProvider(draftRepoProvider), Providers.asDaggerProvider(friendRepoProvider), Providers.asDaggerProvider(savedStateHandleProvider));
  }

  public static DrawViewModel_Factory create(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider,
      Provider<DoodleRepository> doodleRepoProvider, Provider<DraftRepository> draftRepoProvider,
      Provider<FriendRepository> friendRepoProvider,
      Provider<SavedStateHandle> savedStateHandleProvider) {
    return new DrawViewModel_Factory(authRepoProvider, profileRepoProvider, doodleRepoProvider, draftRepoProvider, friendRepoProvider, savedStateHandleProvider);
  }

  public static DrawViewModel newInstance(AuthRepository authRepo, ProfileRepository profileRepo,
      DoodleRepository doodleRepo, DraftRepository draftRepo, FriendRepository friendRepo,
      SavedStateHandle savedStateHandle) {
    return new DrawViewModel(authRepo, profileRepo, doodleRepo, draftRepo, friendRepo, savedStateHandle);
  }
}
