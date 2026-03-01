package com.kawaii.doodle.di;

import com.kawaii.doodle.data.local.AppDatabase;
import com.kawaii.doodle.data.local.dao.ProfileDao;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
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
public final class DatabaseModule_ProvideProfileDaoFactory implements Factory<ProfileDao> {
  private final Provider<AppDatabase> dbProvider;

  public DatabaseModule_ProvideProfileDaoFactory(Provider<AppDatabase> dbProvider) {
    this.dbProvider = dbProvider;
  }

  @Override
  public ProfileDao get() {
    return provideProfileDao(dbProvider.get());
  }

  public static DatabaseModule_ProvideProfileDaoFactory create(
      javax.inject.Provider<AppDatabase> dbProvider) {
    return new DatabaseModule_ProvideProfileDaoFactory(Providers.asDaggerProvider(dbProvider));
  }

  public static DatabaseModule_ProvideProfileDaoFactory create(Provider<AppDatabase> dbProvider) {
    return new DatabaseModule_ProvideProfileDaoFactory(dbProvider);
  }

  public static ProfileDao provideProfileDao(AppDatabase db) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideProfileDao(db));
  }
}
