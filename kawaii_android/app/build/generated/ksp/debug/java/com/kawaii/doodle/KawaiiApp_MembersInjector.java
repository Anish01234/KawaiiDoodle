package com.kawaii.doodle;

import androidx.hilt.work.HiltWorkerFactory;
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
public final class KawaiiApp_MembersInjector implements MembersInjector<KawaiiApp> {
  private final Provider<HiltWorkerFactory> workerFactoryProvider;

  public KawaiiApp_MembersInjector(Provider<HiltWorkerFactory> workerFactoryProvider) {
    this.workerFactoryProvider = workerFactoryProvider;
  }

  public static MembersInjector<KawaiiApp> create(
      Provider<HiltWorkerFactory> workerFactoryProvider) {
    return new KawaiiApp_MembersInjector(workerFactoryProvider);
  }

  public static MembersInjector<KawaiiApp> create(
      javax.inject.Provider<HiltWorkerFactory> workerFactoryProvider) {
    return new KawaiiApp_MembersInjector(Providers.asDaggerProvider(workerFactoryProvider));
  }

  @Override
  public void injectMembers(KawaiiApp instance) {
    injectWorkerFactory(instance, workerFactoryProvider.get());
  }

  @InjectedFieldSignature("com.kawaii.doodle.KawaiiApp.workerFactory")
  public static void injectWorkerFactory(KawaiiApp instance, HiltWorkerFactory workerFactory) {
    instance.workerFactory = workerFactory;
  }
}
