package com.kawaii.doodle.di;

import com.kawaii.doodle.data.repository.AuthRepositoryImpl;
import com.kawaii.doodle.domain.repository.AuthRepository;
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
public final class RepositoryModule_ProvideAuthRepoFactory implements Factory<AuthRepository> {
  private final Provider<AuthRepositoryImpl> implProvider;

  public RepositoryModule_ProvideAuthRepoFactory(Provider<AuthRepositoryImpl> implProvider) {
    this.implProvider = implProvider;
  }

  @Override
  public AuthRepository get() {
    return provideAuthRepo(implProvider.get());
  }

  public static RepositoryModule_ProvideAuthRepoFactory create(
      javax.inject.Provider<AuthRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideAuthRepoFactory(Providers.asDaggerProvider(implProvider));
  }

  public static RepositoryModule_ProvideAuthRepoFactory create(
      Provider<AuthRepositoryImpl> implProvider) {
    return new RepositoryModule_ProvideAuthRepoFactory(implProvider);
  }

  public static AuthRepository provideAuthRepo(AuthRepositoryImpl impl) {
    return Preconditions.checkNotNullFromProvides(RepositoryModule.INSTANCE.provideAuthRepo(impl));
  }
}
