package com.kawaii.doodle.service;

import com.kawaii.doodle.domain.repository.AuthRepository;
import com.kawaii.doodle.domain.repository.ProfileRepository;
import dagger.MembersInjector;
import dagger.internal.DaggerGenerated;
import dagger.internal.InjectedFieldSignature;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import javax.annotation.processing.Generated;

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
public final class KawaiiFirebaseMessagingService_MembersInjector implements MembersInjector<KawaiiFirebaseMessagingService> {
  private final Provider<AuthRepository> authRepoProvider;

  private final Provider<ProfileRepository> profileRepoProvider;

  public KawaiiFirebaseMessagingService_MembersInjector(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider) {
    this.authRepoProvider = authRepoProvider;
    this.profileRepoProvider = profileRepoProvider;
  }

  public static MembersInjector<KawaiiFirebaseMessagingService> create(
      Provider<AuthRepository> authRepoProvider, Provider<ProfileRepository> profileRepoProvider) {
    return new KawaiiFirebaseMessagingService_MembersInjector(authRepoProvider, profileRepoProvider);
  }

  public static MembersInjector<KawaiiFirebaseMessagingService> create(
      javax.inject.Provider<AuthRepository> authRepoProvider,
      javax.inject.Provider<ProfileRepository> profileRepoProvider) {
    return new KawaiiFirebaseMessagingService_MembersInjector(Providers.asDaggerProvider(authRepoProvider), Providers.asDaggerProvider(profileRepoProvider));
  }

  @Override
  public void injectMembers(KawaiiFirebaseMessagingService instance) {
    injectAuthRepo(instance, authRepoProvider.get());
    injectProfileRepo(instance, profileRepoProvider.get());
  }

  @InjectedFieldSignature("com.kawaii.doodle.service.KawaiiFirebaseMessagingService.authRepo")
  public static void injectAuthRepo(KawaiiFirebaseMessagingService instance,
      AuthRepository authRepo) {
    instance.authRepo = authRepo;
  }

  @InjectedFieldSignature("com.kawaii.doodle.service.KawaiiFirebaseMessagingService.profileRepo")
  public static void injectProfileRepo(KawaiiFirebaseMessagingService instance,
      ProfileRepository profileRepo) {
    instance.profileRepo = profileRepo;
  }
}
