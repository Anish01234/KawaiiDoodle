package com.kawaii.doodle.di;

import com.kawaii.doodle.data.repository.FriendRepositoryImpl;
import com.kawaii.doodle.domain.repository.FriendRepository;
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
public final class RepositoryModule_ProvideFriendRepoFactory implements Factory<FriendRepository> {
  private final Provider<FriendRepositoryImpl> implProvider;

  public RepositoryModule_ProvideFriendRepoFactory(Provider<FriendRepositoryImpl> implProvider) {
    this.implProvider = implProvider;
  }

  @Override
  public FriendRepository get() {
    return provideFriendRepo(implProvider.get());
  }

  public static RepositoryModule_ProvideFriendRepoFactory create(
      javax.inject.Provider<FriendRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideFriendRepoFactory(Providers.asDaggerProvider(implProvider));
  }

  public static RepositoryModule_ProvideFriendRepoFactory create(
      Provider<FriendRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideFriendRepoFactory(implProvider);
  }

  public static FriendRepository provideFriendRepo(FriendRepositoryImpl impl) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideFriendRepo(impl));
  }
}
